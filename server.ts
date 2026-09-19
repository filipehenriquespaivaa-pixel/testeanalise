import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  saveMatchesToDb,
  getMatchesFromDb,
  saveTeamToDb,
  getTeamFromDb,
  searchH2HMatches,
  getDatabaseStats,
  syncExistingJsonFilesToSqlite
} from './server/db';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Key configuration
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '3e2168a115c2478b9b3e483296d60379';
const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || 'f76e053ae6308cfa79285530939745b6';
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

// API-Football Quota Tracker (100 req/day limit)
let apiFootballQuota = {
  current: 14,
  limit_day: 100,
  remaining: 86,
  lastChecked: 0
};

async function updateApiFootballQuota(force = false) {
  const now = Date.now();
  if (!force && now - apiFootballQuota.lastChecked < 60000) {
    return apiFootballQuota;
  }
  try {
    const res = await fetch(`${API_FOOTBALL_BASE_URL}/status`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    if (res.ok) {
      const data: any = await res.json();
      const reqs = data.response?.requests;
      if (reqs) {
        apiFootballQuota = {
          current: reqs.current,
          limit_day: reqs.limit_day,
          remaining: Math.max(0, reqs.limit_day - reqs.current),
          lastChecked: now
        };
      }
    }
  } catch (err) {
    console.error('Erro ao verificar cota da API-Football:', err);
  }
  return apiFootballQuota;
}

// Rate Limiting tracker (Free tier: max 10 requests per 60 seconds)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const requestTimestamps: number[] = [];

function cleanOldTimestamps() {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
}

function getRateLimitInfo() {
  cleanOldTimestamps();
  const now = Date.now();
  const requestsInWindow = requestTimestamps.length;
  const remaining = Math.max(0, RATE_LIMIT_MAX - requestsInWindow);
  let resetSeconds = 0;
  if (requestsInWindow >= RATE_LIMIT_MAX && requestTimestamps.length > 0) {
    resetSeconds = Math.max(0, Math.ceil((requestTimestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
  }
  return {
    limit: RATE_LIMIT_MAX,
    remaining,
    resetSeconds,
    requestsInWindow,
    isRateLimited: remaining === 0
  };
}

function recordRequest() {
  cleanOldTimestamps();
  requestTimestamps.push(Date.now());
}

// In-Memory Cache to strictly respect rate limits
interface CacheEntry {
  data: any;
  cachedAt: string;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

function getCacheTTL(dateStr: string): number {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) {
    return 60 * 1000; // 60 seconds for today (keeps scores fresh without spamming)
  }
  if (dateStr < today) {
    return 24 * 60 * 60 * 1000; // 24 hours for past dates (final results do not change)
  }
  return 30 * 60 * 1000; // 30 minutes for future dates
}

// API Routes
app.get('/api/rate-limit', (req, res) => {
  res.json(getRateLimitInfo());
});

// Normalizer for API-Football fixture to standard Match
function normalizeApiFootballFixture(f: any, compDef: any): any {
  const goals = f.goals || {};
  const score = f.score || {};
  const statusShort = f.fixture?.status?.short;

  let mappedStatus = 'TIMED';
  if (['FT', 'AET', 'PEN'].includes(statusShort)) mappedStatus = 'FINISHED';
  else if (['1H', '2H', 'HT', 'ET', 'P', 'BT'].includes(statusShort)) mappedStatus = 'IN_PLAY';
  else if (['PST', 'SUSP', 'INT'].includes(statusShort)) mappedStatus = 'POSTPONED';
  else if (['CANC', 'ABD'].includes(statusShort)) mappedStatus = 'CANCELLED';

  let winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null = null;
  if (f.teams?.home?.winner) winner = 'HOME_TEAM';
  else if (f.teams?.away?.winner) winner = 'AWAY_TEAM';
  else if (goals.home !== null && goals.away !== null && goals.home === goals.away) winner = 'DRAW';

  let matchday: number | null = null;
  if (f.league?.round) {
    const m = f.league.round.match(/\d+/);
    if (m) matchday = parseInt(m[0], 10);
  }

  return {
    id: f.fixture.id,
    utcDate: f.fixture.date,
    status: mappedStatus,
    matchday,
    venue: f.fixture.venue?.name,
    competition: {
      id: f.league.id,
      name: compDef?.name || f.league.name,
      code: compDef?.code || 'COMP',
      type: 'LEAGUE',
      emblem: f.league.logo
    },
    area: {
      id: 0,
      name: f.league.country || compDef?.country || 'Mundo',
      code: compDef?.countryCode || '',
      flag: f.league.flag
    },
    homeTeam: {
      id: f.teams.home.id,
      name: f.teams.home.name,
      crest: f.teams.home.logo
    },
    awayTeam: {
      id: f.teams.away.id,
      name: f.teams.away.name,
      crest: f.teams.away.logo
    },
    score: {
      winner,
      duration: 'REGULAR',
      fullTime: { home: goals.home, away: goals.away },
      halfTime: { home: score.halftime?.home ?? null, away: score.halftime?.away ?? null },
      extraTime: { home: score.extratime?.home ?? null, away: score.extratime?.away ?? null },
      penalties: { home: score.penalty?.home ?? null, away: score.penalty?.away ?? null }
    },
    dataSource: 'API_FOOTBALL'
  };
}

app.get('/api/matches', async (req, res) => {
  const dateParam = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const forceRefresh = req.query.force === 'true';
  const cacheKey = `matches_${dateParam}`;

  await updateApiFootballQuota();

  // Check cache first (unless forced and not rate-limited)
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now && !forceRefresh) {
    return res.json({
      date: dateParam,
      totalMatches: cached.data.matches?.length || 0,
      matches: cached.data.matches || [],
      cached: true,
      cachedAt: cached.cachedAt,
      rateLimit: getRateLimitInfo(),
      apiFootballQuota
    });
  }

  // Check rate limit for Football-Data before dispatching
  const rateLimitStatus = getRateLimitInfo();
  if (rateLimitStatus.isRateLimited) {
    if (cached) {
      return res.json({
        date: dateParam,
        totalMatches: cached.data.matches?.length || 0,
        matches: cached.data.matches || [],
        cached: true,
        cachedAt: cached.cachedAt,
        rateLimit: rateLimitStatus,
        apiFootballQuota,
        warning: `Limite de 10 req/min atingido na Football-Data. Exibindo dados em cache. Aguarde ${rateLimitStatus.resetSeconds}s.`
      });
    }
  }

  let mergedMatches: any[] = [];

  // 1. Fetch from Football-Data.org (Core 12 European & Brazilian leagues)
  try {
    if (!rateLimitStatus.isRateLimited) {
      recordRequest();
      const apiUrl = `${FOOTBALL_DATA_BASE_URL}/matches?date=${dateParam}`;
      const response = await fetch(apiUrl, {
        headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
      });

      if (response.ok) {
        const data: any = await response.json();
        const fdMatches = (data.matches || []).map((m: any) => ({
          ...m,
          dataSource: 'FOOTBALL_DATA'
        }));
        mergedMatches = [...fdMatches];
      }
    }
  } catch (error: any) {
    console.error('Erro ao buscar jogos da Football-Data:', error);
  }

  // 2. Fetch from API-Football for the 8 exclusive leagues (Série B, Libertadores, Copa do Brasil, etc.)
  // We cache API-Football day fixtures for 15 minutes to save daily quota
  const apifbCacheKey = `apifb_date_${dateParam}`;
  const apifbCached = memoryCache.get(apifbCacheKey);

  if (apifbCached && apifbCached.expiresAt > now && !forceRefresh) {
    mergedMatches = [...mergedMatches, ...(apifbCached.data.matches || [])];
  } else if (apiFootballQuota.remaining > 4) {
    try {
      const apifbRes = await fetch(`${API_FOOTBALL_BASE_URL}/fixtures?date=${dateParam}`, {
        headers: { 'x-apisports-key': API_FOOTBALL_KEY }
      });
      if (apifbRes.ok) {
        const apifbData: any = await apifbRes.json();
        apiFootballQuota.current++;
        apiFootballQuota.remaining = Math.max(0, apiFootballQuota.limit_day - apiFootballQuota.current);

        const exclusiveCompIds = [72, 13, 73, 11, 307, 128, 129, 130];
        const exclusiveCompsMap: Record<number, any> = {
          72: { code: 'BSB', name: 'Brasileirão Série B', country: 'Brasil', countryCode: 'BRA' },
          13: { code: 'CLI', name: 'CONMEBOL Libertadores', country: 'América do Sul', countryCode: 'SAM' },
          73: { code: 'CDB', name: 'Copa do Brasil', country: 'Brasil', countryCode: 'BRA' },
          11: { code: 'CSU', name: 'CONMEBOL Sudamericana', country: 'América do Sul', countryCode: 'SAM' },
          307: { code: 'SPL', name: 'Saudi Pro League', country: 'Arábia Saudita', countryCode: 'SAU' },
          128: { code: 'LPA', name: 'Liga Profesional Argentina', country: 'Argentina', countryCode: 'ARG' },
          129: { code: 'PNA', name: 'Primera Nacional', country: 'Argentina', countryCode: 'ARG' },
          130: { code: 'CAR', name: 'Copa Argentina', country: 'Argentina', countryCode: 'ARG' }
        };

        const extraFixtures = (apifbData.response || []).filter((f: any) =>
          exclusiveCompIds.includes(f.league?.id)
        );

        const extraMatches = extraFixtures.map((f: any) =>
          normalizeApiFootballFixture(f, exclusiveCompsMap[f.league.id])
        );

        memoryCache.set(apifbCacheKey, {
          data: { matches: extraMatches },
          cachedAt: new Date().toISOString(),
          expiresAt: Date.now() + 15 * 60 * 1000
        });

        mergedMatches = [...mergedMatches, ...extraMatches];
      }
    } catch (e) {
      console.error('Erro ao buscar jogos complementares da API-Football:', e);
    }
  }

  // Save merged result to main cache
  const ttl = getCacheTTL(dateParam);
  const cachedAt = new Date().toISOString();
  memoryCache.set(cacheKey, {
    data: { matches: mergedMatches },
    cachedAt,
    expiresAt: Date.now() + ttl
  });

  return res.json({
    date: dateParam,
    totalMatches: mergedMatches.length,
    matches: mergedMatches,
    cached: false,
    cachedAt,
    rateLimit: getRateLimitInfo(),
    apiFootballQuota
  });
});

// Standings endpoint for additional context (cached for 10 min)
app.get('/api/competition/:code/standings', async (req, res) => {
  const code = req.params.code;
  const cacheKey = `standings_${code}`;
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return res.json({ ...cached.data, cached: true });
  }

  const rateLimitStatus = getRateLimitInfo();
  if (rateLimitStatus.isRateLimited) {
    if (cached) return res.json({ ...cached.data, cached: true });
    return res.status(429).json({ error: 'Limite de requisições atingido. Aguarde.' });
  }

  try {
    recordRequest();
    const response = await fetch(`${FOOTBALL_DATA_BASE_URL}/competitions/${code}/standings`, {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Não foi possível carregar a tabela' });
    }
    const data = await response.json();
    memoryCache.set(cacheKey, {
      data,
      cachedAt: new Date().toISOString(),
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    return res.json({ ...data, cached: false });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================
// Historical Seasons Manager (5 years across 20 competitions)
// Uses API-Football to download full seasons (1 request = ~380 matches)
// ==========================================
const HISTORY_DIR = path.join(process.cwd(), 'data', 'history');
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

interface HistoricalTask {
  competitionCode: string;
  competitionName: string;
  apiFootballId: number;
  season: number;
  provider: 'API_FOOTBALL' | 'FOOTBALL_DATA';
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'not_available';
  matchCount?: number;
  error?: string;
  downloadedAt?: string;
}

const ALL_20_COMPETITIONS = [
  { code: 'BSA', name: 'Brasileirão Série A', apiFootballId: 71, country: 'Brasil', countryCode: 'BRA' },
  { code: 'CL', name: 'UEFA Champions League', apiFootballId: 2, country: 'Europa', countryCode: 'EUR' },
  { code: 'PD', name: 'La Liga', apiFootballId: 140, country: 'Espanha', countryCode: 'ESP' },
  { code: 'PL', name: 'Premier League', apiFootballId: 39, country: 'Inglaterra', countryCode: 'ENG' },
  { code: 'BL1', name: 'Bundesliga', apiFootballId: 78, country: 'Alemanha', countryCode: 'DEU' },
  { code: 'SA', name: 'Serie A (Itália)', apiFootballId: 135, country: 'Itália', countryCode: 'ITA' },
  { code: 'FL1', name: 'Ligue 1', apiFootballId: 61, country: 'França', countryCode: 'FRA' },
  { code: 'DED', name: 'Eredivisie', apiFootballId: 88, country: 'Holanda', countryCode: 'NLD' },
  { code: 'ELC', name: 'Championship', apiFootballId: 40, country: 'Inglaterra', countryCode: 'ENG' },
  { code: 'PPL', name: 'Primeira Liga', apiFootballId: 94, country: 'Portugal', countryCode: 'PRT' },
  { code: 'WC', name: 'Copa do Mundo FIFA', apiFootballId: 1, country: 'Mundo', countryCode: 'WLD' },
  { code: 'EC', name: 'Eurocopa', apiFootballId: 4, country: 'Europa', countryCode: 'EUR' },
  { code: 'BSB', name: 'Brasileirão Série B', apiFootballId: 72, country: 'Brasil', countryCode: 'BRA' },
  { code: 'CLI', name: 'Copa Libertadores', apiFootballId: 13, country: 'América do Sul', countryCode: 'SAM' },
  { code: 'CDB', name: 'Copa do Brasil', apiFootballId: 73, country: 'Brasil', countryCode: 'BRA' },
  { code: 'CSU', name: 'Copa Sul-Americana', apiFootballId: 11, country: 'América do Sul', countryCode: 'SAM' },
  { code: 'SPL', name: 'Saudi Pro League', apiFootballId: 307, country: 'Arábia Saudita', countryCode: 'SAU' },
  { code: 'LPA', name: 'Liga Profesional Argentina', apiFootballId: 128, country: 'Argentina', countryCode: 'ARG' },
  { code: 'PNA', name: 'Primera Nacional', apiFootballId: 129, country: 'Argentina', countryCode: 'ARG' },
  { code: 'CAR', name: 'Copa Argentina', apiFootballId: 130, country: 'Argentina', countryCode: 'ARG' }
];

// 5 years of history
const SEASONS_TO_FETCH = [2024, 2023, 2022, 2021, 2020];

function getHistoricalFilePath(code: string, season: number): string {
  return path.join(HISTORY_DIR, `${code}_${season}.json`);
}

// Build initial list of tasks
function initializeHistoryTasks(): HistoricalTask[] {
  const tasks: HistoricalTask[] = [];
  for (const comp of ALL_20_COMPETITIONS) {
    for (const season of SEASONS_TO_FETCH) {
      const filePath = getHistoricalFilePath(comp.code, season);
      let status: HistoricalTask['status'] = 'pending';
      let matchCount: number | undefined = undefined;
      let downloadedAt: string | undefined = undefined;

      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          status = 'completed';
          matchCount = parsed.matches?.length || 0;
          downloadedAt = parsed.downloadedAt;
        } catch {
          status = 'pending';
        }
      }

      tasks.push({
        competitionCode: comp.code,
        competitionName: comp.name,
        apiFootballId: comp.apiFootballId,
        season,
        provider: 'API_FOOTBALL',
        status,
        matchCount,
        downloadedAt
      });
    }
  }
  return tasks;
}

let historyTasks: HistoricalTask[] = initializeHistoryTasks();
let isHistoryWorkerRunning = false;
let shouldStopHistoryWorker = false;
let historyCurrentLabel = '';
let historySecondsUntilNext = 0;
let historyCountdownTimer: any = null;

// Sequential safe downloader queue using API-Football (1 req brings all fixtures of that season)
async function runHistoryDownloader(filterCompCode?: string) {
  if (isHistoryWorkerRunning) return;
  isHistoryWorkerRunning = true;
  shouldStopHistoryWorker = false;

  try {
    for (let i = 0; i < historyTasks.length; i++) {
      if (shouldStopHistoryWorker) {
        historyCurrentLabel = 'Download pausado pelo usuário.';
        break;
      }

      const task = historyTasks[i];
      if (filterCompCode && task.competitionCode !== filterCompCode) continue;
      if (task.status === 'completed') continue;

      // Check remaining daily requests on API-Football
      await updateApiFootballQuota();
      if (apiFootballQuota.remaining <= 3) {
        historyCurrentLabel = `Cota diária da API-Football quase no limite (${apiFootballQuota.remaining} restantes). Pausado para proteger seu limite diário.`;
        task.status = 'pending';
        break;
      }

      historyCurrentLabel = `Baixando ${task.competitionName} (${task.season}) via API-Football...`;
      task.status = 'downloading';

      try {
        const compDef = ALL_20_COMPETITIONS.find((c) => c.code === task.competitionCode);
        const url = `${API_FOOTBALL_BASE_URL}/fixtures?league=${task.apiFootballId}&season=${task.season}`;
        const response = await fetch(url, {
          headers: { 'x-apisports-key': API_FOOTBALL_KEY }
        });

        apiFootballQuota.current++;
        apiFootballQuota.remaining = Math.max(0, apiFootballQuota.limit_day - apiFootballQuota.current);

        if (response.status === 429) {
          task.status = 'pending';
          historyCurrentLabel = 'Limite por minuto atingido na API-Football. Aguardando 30s...';
          await new Promise((resolve) => setTimeout(resolve, 30000));
          i--;
          continue;
        }

        if (!response.ok) {
          task.status = 'error';
          task.error = `Erro HTTP ${response.status}`;
        } else {
          const data: any = await response.json();
          const fixtures = data.response || [];

          if (fixtures.length === 0) {
            task.status = 'not_available';
            task.error = 'Temporada sem partidas cadastradas nesta edição';
            task.matchCount = 0;
          } else {
            const normalizedMatches = fixtures.map((f: any) =>
              normalizeApiFootballFixture(f, compDef)
            );

            task.status = 'completed';
            task.matchCount = normalizedMatches.length;
            task.downloadedAt = new Date().toISOString();

            // Save to disk
            const filePath = getHistoricalFilePath(task.competitionCode, task.season);
            fs.writeFileSync(
              filePath,
              JSON.stringify(
                {
                  competition: task.competitionCode,
                  competitionName: task.competitionName,
                  season: task.season,
                  provider: 'API_FOOTBALL',
                  downloadedAt: task.downloadedAt,
                  totalMatches: normalizedMatches.length,
                  matches: normalizedMatches
                },
                null,
                2
              )
            );

            // Also persist directly into SQLite database
            try {
              saveMatchesToDb(
                normalizedMatches,
                task.competitionCode,
                task.season,
                task.competitionName,
                'API_FOOTBALL'
              );
            } catch (dbErr) {
              console.warn('Erro ao gravar no SQLite:', dbErr);
            }
          }
        }
      } catch (err: any) {
        task.status = 'error';
        task.error = err.message || 'Falha na conexão';
      }

      // Safe pause of 3.5s between calls to prevent burst limits
      if (i < historyTasks.length - 1 && !shouldStopHistoryWorker) {
        historySecondsUntilNext = 4;
        clearInterval(historyCountdownTimer);
        historyCountdownTimer = setInterval(() => {
          if (historySecondsUntilNext > 0) historySecondsUntilNext--;
        }, 1000);
        await new Promise((resolve) => setTimeout(resolve, 4000));
        clearInterval(historyCountdownTimer);
        historySecondsUntilNext = 0;
      }
    }
  } finally {
    isHistoryWorkerRunning = false;
    if (!shouldStopHistoryWorker && historyCurrentLabel.startsWith('Baixando')) {
      historyCurrentLabel = 'Processamento do histórico finalizado!';
    }
    historySecondsUntilNext = 0;
    await updateApiFootballQuota(true);
  }
}

// History API Routes
app.get('/api/history/status', async (req, res) => {
  await updateApiFootballQuota();
  const completed = historyTasks.filter((t) => t.status === 'completed' || t.status === 'not_available').length;
  res.json({
    isRunning: isHistoryWorkerRunning,
    totalItems: historyTasks.length,
    completedItems: completed,
    currentLabel: historyCurrentLabel,
    secondsUntilNextRequest: historySecondsUntilNext,
    rateLimit: getRateLimitInfo(),
    apiFootballQuota,
    items: historyTasks
  });
});

app.post('/api/history/start', (req, res) => {
  const compCode = req.body?.competitionCode;
  if (!isHistoryWorkerRunning) {
    runHistoryDownloader(compCode).catch((e) => console.error('Erro no worker de histórico:', e));
  }
  res.json({ success: true, message: 'Download de histórico iniciado em segundo plano.' });
});

app.post('/api/history/pause', (req, res) => {
  shouldStopHistoryWorker = true;
  res.json({ success: true, message: 'Solicitação de pausa enviada.' });
});

// Endpoint to view downloaded matches of a competition & season
app.get('/api/history/:code/:season', (req, res) => {
  const code = req.params.code;
  const season = parseInt(req.params.season, 10);
  const filePath = getHistoricalFilePath(code, season);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Histórico ainda não baixado para esta temporada.' });
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao ler arquivo histórico.' });
  }
});

// TheSportsDB Team Details Endpoint
const THESPORTSDB_KEY = process.env.THESPORTSDB_API_KEY || '123';
const TEAMS_CACHE_DIR = path.join(process.cwd(), 'history_data', 'teams');
if (!fs.existsSync(TEAMS_CACHE_DIR)) {
  try {
    fs.mkdirSync(TEAMS_CACHE_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function getSafeTeamSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

app.get('/api/team-details', async (req, res) => {
  const rawName = (req.query.name as string || '').trim();
  if (!rawName) {
    return res.status(400).json({ error: 'Nome do time é obrigatório.' });
  }

  const slug = getSafeTeamSlug(rawName);
  const cacheFile = path.join(TEAMS_CACHE_DIR, `${slug}.json`);

  // 1. Check local persistent disk cache
  if (fs.existsSync(cacheFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      return res.json({ ...data, fromCache: true });
    } catch {
      // fallback to live fetch if file is corrupted
    }
  }

  // 2. Query TheSportsDB with fallback name variations
  const variations = [
    rawName,
    rawName.replace(/-/g, ' '),
    rawName.replace(/^(FC|CF|SC|AC|CR|SE)\s+/i, '').replace(/\s+(FC|CF|SC|AC|CR|SE)$/i, '').trim(),
    rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  ];
  const uniqueVariations = Array.from(new Set(variations.filter(Boolean)));

  try {
    let teamData: any = null;

    for (const queryName of uniqueVariations) {
      const url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(queryName)}`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json?.teams && json.teams.length > 0) {
          teamData = json.teams[0];
          break;
        }
      }
    }

    if (!teamData) {
      return res.status(404).json({ error: `Clube "${rawName}" não encontrado no TheSportsDB.` });
    }

    const result = {
      idTeam: teamData.idTeam,
      name: teamData.strTeam,
      shortName: teamData.strTeamShort || teamData.strTeamAlternate || teamData.strTeam,
      formedYear: teamData.intFormedYear,
      stadium: teamData.strStadium,
      stadiumCapacity: teamData.intStadiumCapacity,
      stadiumLocation: teamData.strLocation,
      badge: teamData.strBadge,
      banner: teamData.strBanner,
      jersey: teamData.strEquipment,
      website: teamData.strWebsite ? (teamData.strWebsite.startsWith('http') ? teamData.strWebsite : `https://${teamData.strWebsite}`) : undefined,
      facebook: teamData.strFacebook ? (teamData.strFacebook.startsWith('http') ? teamData.strFacebook : `https://${teamData.strFacebook}`) : undefined,
      twitter: teamData.strTwitter ? (teamData.strTwitter.startsWith('http') ? teamData.strTwitter : `https://${teamData.strTwitter}`) : undefined,
      instagram: teamData.strInstagram ? (teamData.strInstagram.startsWith('http') ? teamData.strInstagram : `https://${teamData.strInstagram}`) : undefined,
      youtube: teamData.strYoutube ? (teamData.strYoutube.startsWith('http') ? teamData.strYoutube : `https://${teamData.strYoutube}`) : undefined,
      descriptionPT: teamData.strDescriptionPT || teamData.strDescriptionEN,
      descriptionEN: teamData.strDescriptionEN,
      league: teamData.strLeague,
      country: teamData.strCountry,
      colors: [teamData.strColour1, teamData.strColour2, teamData.strColour3].filter(Boolean)
    };

    // Save permanently to disk cache
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Não foi possível salvar cache do time em disco:', err);
    }

    res.json(result);
  } catch (err: any) {
    console.error('Erro ao buscar time no TheSportsDB:', err);
    res.status(500).json({ error: 'Erro de conexão com o TheSportsDB.' });
  }
});

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
