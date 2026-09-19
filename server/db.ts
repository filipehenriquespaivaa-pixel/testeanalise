import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'history_data');
const DB_PATH = path.join(DB_DIR, 'football.db');

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  // Matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      competition_code TEXT,
      season INTEGER,
      matchday INTEGER,
      utc_date TEXT,
      status TEXT,
      home_team_id TEXT,
      home_team_name TEXT,
      home_team_crest TEXT,
      away_team_id TEXT,
      away_team_name TEXT,
      away_team_crest TEXT,
      score_home INTEGER,
      score_away INTEGER,
      winner TEXT,
      venue TEXT,
      source TEXT,
      raw_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_matches_comp_season ON matches(competition_code, season);
    CREATE INDEX IF NOT EXISTS idx_matches_utc_date ON matches(utc_date);
    CREATE INDEX IF NOT EXISTS idx_matches_home_name ON matches(home_team_name);
    CREATE INDEX IF NOT EXISTS idx_matches_away_name ON matches(away_team_name);

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      short_name TEXT,
      formed_year TEXT,
      stadium TEXT,
      stadium_capacity TEXT,
      stadium_location TEXT,
      badge TEXT,
      banner TEXT,
      jersey TEXT,
      website TEXT,
      facebook TEXT,
      twitter TEXT,
      instagram TEXT,
      youtube TEXT,
      description_pt TEXT,
      description_en TEXT,
      league TEXT,
      country TEXT,
      colors_json TEXT,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

    CREATE TABLE IF NOT EXISTS history_seasons (
      key TEXT PRIMARY KEY,
      competition_code TEXT,
      competition_name TEXT,
      season INTEGER,
      provider TEXT,
      total_matches INTEGER,
      downloaded_at TEXT
    );
  `);
}

export function saveMatchesToDb(
  matches: any[],
  competitionCode: string,
  season: number,
  competitionName: string,
  provider: string = 'API_FOOTBALL'
) {
  const db = getDatabase();

  const insertMatch = db.prepare(`
    INSERT OR REPLACE INTO matches (
      id, competition_code, season, matchday, utc_date, status,
      home_team_id, home_team_name, home_team_crest,
      away_team_id, away_team_name, away_team_crest,
      score_home, score_away, winner, venue, source, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const m of matches) {
      const homeScore = m.score?.fullTime?.home ?? m.score?.current?.home ?? null;
      const awayScore = m.score?.fullTime?.away ?? m.score?.current?.away ?? null;
      const winner = m.score?.winner ?? null;

      insertMatch.run(
        String(m.id || `${competitionCode}_${season}_${m.homeTeam?.name}_${m.awayTeam?.name}`),
        competitionCode,
        season,
        m.matchday ?? null,
        m.utcDate || '',
        m.status || 'FINISHED',
        String(m.homeTeam?.id || ''),
        m.homeTeam?.name || '',
        m.homeTeam?.crest || '',
        String(m.awayTeam?.id || ''),
        m.awayTeam?.name || '',
        m.awayTeam?.crest || '',
        homeScore,
        awayScore,
        winner,
        m.venue || '',
        provider,
        JSON.stringify(m)
      );
    }

    const insertSeason = db.prepare(`
      INSERT OR REPLACE INTO history_seasons (
        key, competition_code, competition_name, season, provider, total_matches, downloaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertSeason.run(
      `${competitionCode}_${season}`,
      competitionCode,
      competitionName,
      season,
      provider,
      matches.length,
      new Date().toISOString()
    );

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function getMatchesFromDb(competitionCode: string, season: number) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM matches
    WHERE competition_code = ? AND season = ?
    ORDER BY utc_date ASC
  `).all(competitionCode, season);

  return rows.map((r: any) => {
    if (r.raw_json) {
      try {
        return JSON.parse(r.raw_json);
      } catch {
        // fallback
      }
    }
    return {
      id: r.id,
      utcDate: r.utc_date,
      status: r.status,
      matchday: r.matchday,
      venue: r.venue,
      competition: {
        id: 0,
        name: r.competition_code,
        code: r.competition_code,
        type: 'LEAGUE'
      },
      homeTeam: {
        id: r.home_team_id,
        name: r.home_team_name,
        crest: r.home_team_crest
      },
      awayTeam: {
        id: r.away_team_id,
        name: r.away_team_name,
        crest: r.away_team_crest
      },
      score: {
        winner: r.winner,
        fullTime: {
          home: r.score_home,
          away: r.score_away
        }
      }
    };
  });
}

export function saveTeamToDb(team: any) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO teams (
      id, name, short_name, formed_year, stadium, stadium_capacity,
      stadium_location, badge, banner, jersey, website, facebook,
      twitter, instagram, youtube, description_pt, description_en,
      league, country, colors_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    String(team.idTeam || team.id || team.name),
    team.name,
    team.shortName || team.name,
    team.formedYear || null,
    team.stadium || null,
    team.stadiumCapacity || null,
    team.stadiumLocation || null,
    team.badge || null,
    team.banner || null,
    team.jersey || null,
    team.website || null,
    team.facebook || null,
    team.twitter || null,
    team.instagram || null,
    team.youtube || null,
    team.descriptionPT || null,
    team.descriptionEN || null,
    team.league || null,
    team.country || null,
    JSON.stringify(team.colors || []),
    new Date().toISOString()
  );
}

export function getTeamFromDb(name: string) {
  const db = getDatabase();
  const searchName = name.trim();
  const row: any = db.prepare(`
    SELECT * FROM teams
    WHERE LOWER(name) = LOWER(?) OR LOWER(short_name) = LOWER(?)
    LIMIT 1
  `).get(searchName, searchName);

  if (!row) return null;

  return {
    idTeam: row.id,
    name: row.name,
    shortName: row.short_name,
    formedYear: row.formed_year,
    stadium: row.stadium,
    stadiumCapacity: row.stadium_capacity,
    stadiumLocation: row.stadium_location,
    badge: row.badge,
    banner: row.banner,
    jersey: row.jersey,
    website: row.website,
    facebook: row.facebook,
    twitter: row.twitter,
    instagram: row.instagram,
    youtube: row.youtube,
    descriptionPT: row.description_pt,
    descriptionEN: row.description_en,
    league: row.league,
    country: row.country,
    colors: row.colors_json ? JSON.parse(row.colors_json) : [],
    fromCache: true,
    fromSqlite: true
  };
}

export function searchH2HMatches(teamA: string, teamB?: string, limit: number = 50) {
  const db = getDatabase();
  const a = `%${teamA.trim()}%`;

  if (teamB && teamB.trim()) {
    const b = `%${teamB.trim()}%`;
    const rows = db.prepare(`
      SELECT * FROM matches
      WHERE ((home_team_name LIKE ? AND away_team_name LIKE ?)
         OR (home_team_name LIKE ? AND away_team_name LIKE ?))
      ORDER BY utc_date DESC
      LIMIT ?
    `).all(a, b, b, a, limit);

    return rows.map((r: any) => (r.raw_json ? JSON.parse(r.raw_json) : r));
  } else {
    const rows = db.prepare(`
      SELECT * FROM matches
      WHERE home_team_name LIKE ? OR away_team_name LIKE ?
      ORDER BY utc_date DESC
      LIMIT ?
    `).all(a, a, limit);

    return rows.map((r: any) => (r.raw_json ? JSON.parse(r.raw_json) : r));
  }
}

export function getDatabaseStats() {
  const db = getDatabase();

  const matchCountRow: any = db.prepare('SELECT COUNT(*) as count FROM matches').get();
  const teamCountRow: any = db.prepare('SELECT COUNT(*) as count FROM teams').get();
  const seasonCountRow: any = db.prepare('SELECT COUNT(*) as count FROM history_seasons').get();
  const seasons: any = db.prepare('SELECT * FROM history_seasons ORDER BY season DESC, competition_name ASC').all();

  let fileSizeBytes = 0;
  if (fs.existsSync(DB_PATH)) {
    try {
      fileSizeBytes = fs.statSync(DB_PATH).size;
    } catch {
      // ignore
    }
  }

  return {
    engine: 'SQLite 3 (Embutido)',
    dbFile: 'history_data/football.db',
    totalMatches: matchCountRow?.count || 0,
    totalTeams: teamCountRow?.count || 0,
    totalSeasons: seasonCountRow?.count || 0,
    fileSizeBytes,
    fileSizeFormatted: `${(fileSizeBytes / 1024).toFixed(1)} KB`,
    seasons
  };
}

// Auto-migration from existing JSON files into SQLite on startup
export function syncExistingJsonFilesToSqlite() {
  if (!fs.existsSync(DB_DIR)) return;

  try {
    // 1. Sync teams
    const teamsDir = path.join(DB_DIR, 'teams');
    if (fs.existsSync(teamsDir)) {
      const files = fs.readdirSync(teamsDir).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(teamsDir, f), 'utf-8'));
          if (content?.name) {
            saveTeamToDb(content);
          }
        } catch {
          // ignore corrupted
        }
      }
    }

    // 2. Sync history seasons
    const seasonFiles = fs.readdirSync(DB_DIR).filter((f) => f.endsWith('.json') && f !== 'state.json');
    for (const f of seasonFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(DB_DIR, f), 'utf-8'));
        if (content?.competition && content?.season && Array.isArray(content?.matches)) {
          saveMatchesToDb(
            content.matches,
            content.competition,
            content.season,
            content.competitionName || content.competition,
            content.provider || 'API_FOOTBALL'
          );
        }
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('Erro ao sincronizar arquivos JSON para o SQLite:', err);
  }
}
