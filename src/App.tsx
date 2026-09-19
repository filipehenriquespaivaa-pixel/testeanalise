/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Match, RateLimitInfo, MatchesResponse, COVERED_COMPETITIONS, HistoryDownloadState, ApiFootballQuota } from './types';
import { Header } from './components/Header';
import { DateSelector } from './components/DateSelector';
import { CompetitionFilter } from './components/CompetitionFilter';
import { StatusAndSearchFilter, MatchStatusFilter } from './components/StatusAndSearchFilter';
import { CompetitionSection } from './components/CompetitionSection';
import { RateLimitBanner } from './components/RateLimitBanner';
import { EmptyState } from './components/EmptyState';
import { CoveredCompetitionsModal } from './components/CoveredCompetitionsModal';
import { HistoryModal } from './components/HistoryModal';
import { SeasonViewerModal } from './components/SeasonViewerModal';
import { ClubDetailsModal } from './components/ClubDetailsModal';
import { Trophy, AlertCircle, RefreshCw, Layers, Database, Sparkles } from 'lucide-react';

export default function App() {
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<MatchStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [apiFootballQuota, setApiFootballQuota] = useState<ApiFootballQuota | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cachedAt, setCachedAt] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompModal, setShowCompModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyState, setHistoryState] = useState<HistoryDownloadState | null>(null);
  const [selectedHistoricalView, setSelectedHistoricalView] = useState<{
    code: string;
    season: number;
    name: string;
  } | null>(null);

  // Poll history download status
  const checkHistoryStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/history/status');
      if (res.ok) {
        const data = await res.json();
        setHistoryState(data);
        if (data.apiFootballQuota) {
          setApiFootballQuota(data.apiFootballQuota);
        }
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    checkHistoryStatus();
    // If running, poll every 2.5s; otherwise every 15s
    const pollInterval = historyState?.isRunning ? 2500 : 15000;
    const interval = setInterval(checkHistoryStatus, pollInterval);
    return () => clearInterval(interval);
  }, [checkHistoryStatus, historyState?.isRunning]);

  const handleStartHistoryDownload = async (competitionCode?: string) => {
    try {
      await fetch('/api/history/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionCode })
      });
      checkHistoryStatus();
    } catch (e) {
      console.error('Erro ao disparar download do histórico:', e);
    }
  };

  const handlePauseHistoryDownload = async () => {
    try {
      await fetch('/api/history/pause', { method: 'POST' });
      checkHistoryStatus();
    } catch (e) {
      console.error('Erro ao pausar download do histórico:', e);
    }
  };

  // Fetch matches from local Express server
  const loadMatches = useCallback(async (date: string, force = false) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const url = `/api/matches?date=${date}${force ? '&force=true' : ''}`;
      const res = await fetch(url);
      const data: MatchesResponse = await res.json();

      if (data.rateLimit) {
        setRateLimit(data.rateLimit);
      }
      if (data.apiFootballQuota) {
        setApiFootballQuota(data.apiFootballQuota);
      }

      if (!res.ok) {
        if (res.status === 429) {
          setErrorMessage(
            data.error ||
              'Limite de 10 requisições por minuto atingido. Aguarde a liberação automática.'
          );
        } else {
          setErrorMessage(data.error || `Erro ao carregar partidas (${res.status})`);
        }
        if (data.matches && data.matches.length > 0) {
          setMatches(data.matches);
        }
        setIsCached(data.cached || false);
        return;
      }

      setMatches(data.matches || []);
      setIsCached(data.cached || false);
      setCachedAt(data.cachedAt);
    } catch (err: any) {
      console.error('Falha de conexão com a API:', err);
      setErrorMessage('Falha ao conectar com o serviço de partidas de futebol.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch matches on date change
  useEffect(() => {
    loadMatches(selectedDate);
  }, [selectedDate, loadMatches]);

  // Periodic background refresh for "today" (respects 60s cache TTL to never exceed 10 req/min)
  useEffect(() => {
    const isToday = selectedDate === getTodayDateStr();
    if (!isToday) return;

    // Refresh every 90 seconds in background only if window is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !rateLimit?.isRateLimited) {
        loadMatches(selectedDate, false);
      }
    }, 90 * 1000);

    return () => clearInterval(interval);
  }, [selectedDate, rateLimit?.isRateLimited, loadMatches]);

  // Filter matches based on competition, status, and search query
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // 1. Competition filter
      if (selectedCompetition !== 'ALL' && m.competition?.code !== selectedCompetition) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'LIVE') {
        if (m.status !== 'IN_PLAY' && m.status !== 'PAUSED') return false;
      } else if (statusFilter === 'SCHEDULED') {
        if (m.status !== 'SCHEDULED' && m.status !== 'TIMED') return false;
      } else if (statusFilter === 'FINISHED') {
        if (m.status !== 'FINISHED' && m.status !== 'AWARDED') return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const home = (m.homeTeam?.name || '').toLowerCase();
        const homeShort = (m.homeTeam?.shortName || '').toLowerCase();
        const homeTla = (m.homeTeam?.tla || '').toLowerCase();
        const away = (m.awayTeam?.name || '').toLowerCase();
        const awayShort = (m.awayTeam?.shortName || '').toLowerCase();
        const awayTla = (m.awayTeam?.tla || '').toLowerCase();
        const comp = (m.competition?.name || '').toLowerCase();

        const matchFound =
          home.includes(q) ||
          homeShort.includes(q) ||
          homeTla.includes(q) ||
          away.includes(q) ||
          awayShort.includes(q) ||
          awayTla.includes(q) ||
          comp.includes(q);

        if (!matchFound) return false;
      }

      return true;
    });
  }, [matches, selectedCompetition, statusFilter, searchQuery]);

  // Compute status counts for status badges
  const statusCounts = useMemo(() => {
    let live = 0;
    let scheduled = 0;
    let finished = 0;

    matches.forEach((m) => {
      if (m.status === 'IN_PLAY' || m.status === 'PAUSED') live++;
      else if (m.status === 'SCHEDULED' || m.status === 'TIMED') scheduled++;
      else if (m.status === 'FINISHED' || m.status === 'AWARDED') finished++;
    });

    return {
      all: matches.length,
      live,
      scheduled,
      finished
    };
  }, [matches]);

  // Group filtered matches by competition
  const matchesByCompetition = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        emblem?: string;
        matches: Match[];
      }
    >();

    filteredMatches.forEach((m) => {
      const code = m.competition?.code || 'OUTROS';
      if (!map.has(code)) {
        map.set(code, {
          name: m.competition?.name || 'Competição',
          emblem: m.competition?.emblem,
          matches: []
        });
      }
      map.get(code)!.matches.push(m);
    });

    return Array.from(map.entries()).map(([code, data]) => ({
      code,
      name: data.name,
      emblem: data.emblem,
      matches: data.matches
    }));
  }, [filteredMatches]);

  const handleResetFilters = () => {
    setSelectedCompetition('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  const handleGoToToday = () => {
    setSelectedDate(getTodayDateStr());
    handleResetFilters();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Rate Limit HUD */}
      <Header
        rateLimit={rateLimit}
        apiFootballQuota={apiFootballQuota}
        isCached={isCached}
        cachedAt={cachedAt}
        isLoading={isLoading}
        onRefresh={() => loadMatches(selectedDate, true)}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenClubSearch={() => setSelectedClubName('Flamengo')}
        historyDownloadCount={
          historyState
            ? {
                completed: historyState.completedItems,
                total: historyState.totalItems,
                isRunning: historyState.isRunning
              }
            : undefined
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Rate Limit Alert Banner if limited */}
        {rateLimit?.isRateLimited && (
          <RateLimitBanner
            rateLimit={rateLimit}
            onRetry={() => loadMatches(selectedDate, true)}
          />
        )}

        {/* Generic Error Message Banner */}
        {errorMessage && !rateLimit?.isRateLimited && (
          <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadMatches(selectedDate, true)}
              className="text-amber-400 font-semibold underline hover:text-amber-300 ml-4 flex-shrink-0"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={(newDate) => setSelectedDate(newDate)}
        />

        {/* Summary Overview Bar & Competitions Guide Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl px-4 py-3">
          <div className="flex items-center flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="font-semibold text-white text-sm">
                {statusCounts.all}
              </span>
              <span className="text-slate-400">partidas no dia</span>
            </div>

            <div className="h-3 w-px bg-slate-800 hidden sm:block" />

            {statusCounts.live > 0 && (
              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{statusCounts.live} ao vivo agora</span>
              </div>
            )}

            <div className="flex items-center space-x-1.5 text-slate-400">
              <span>{statusCounts.scheduled} agendadas</span>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <span>{statusCounts.finished} finalizadas</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-2">
            <button
              onClick={() => setSelectedClubName('Flamengo')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
              title="Abrir fichas de clubes TheSportsDB (estádios, uniformes, capacidade e histórias)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Fichas de Clubes</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Histórico (5 Anos)</span>
              {historyState && (
                <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">
                  {historyState.completedItems}/{historyState.totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowCompModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>20 Competições</span>
            </button>
          </div>
        </div>

        {/* Competition Horizontal Filter */}
        <CompetitionFilter
          selectedCompetition={selectedCompetition}
          onSelectCompetition={(code) => setSelectedCompetition(code)}
          matches={matches}
        />

        {/* Status and Search Filter */}
        <StatusAndSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          counts={statusCounts}
        />

        {/* Loading Spinner Skeleton */}
        {isLoading && matches.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">
              Consultando partidas de futebol nas APIs integradas...
            </p>
          </div>
        ) : matchesByCompetition.length > 0 ? (
          /* Match List Grouped by Competition */
          <div className="space-y-6">
            {matchesByCompetition.map((group) => (
              <CompetitionSection
                key={group.code}
                competitionCode={group.code}
                competitionName={group.name}
                competitionEmblem={group.emblem}
                matches={group.matches}
                onSelectTeam={(name) => setSelectedClubName(name)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <EmptyState
            selectedCompetition={selectedCompetition}
            searchQuery={searchQuery}
            selectedDate={selectedDate}
            onResetFilters={handleResetFilters}
            onGoToToday={handleGoToToday}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p>
            Dados integrados via{' '}
            <a
              href="https://www.football-data.org"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline font-medium"
            >
              Football-Data.org
            </a>{' '}
            (jogos ao vivo e placares diários),{' '}
            <a
              href="https://api-football.com"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline font-medium"
            >
              API-Football
            </a>{' '}
            (histórico de 5 anos e 20 competições com 100 req/dia) e{' '}
            <a
              href="https://www.thesportsdb.com"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:underline font-medium"
            >
              TheSportsDB
            </a>{' '}
            (estádios, uniformes, fundação e fichas de clubes com 30 req/min e cache persistente).
          </p>
          <p className="text-[11px] text-slate-600">
            Horários sincronizados automaticamente com o fuso horário do seu dispositivo.
          </p>
        </div>
      </footer>

      {/* Covered Competitions Modal */}
      <CoveredCompetitionsModal
        isOpen={showCompModal}
        onClose={() => setShowCompModal(false)}
        onSelectCompetition={(code) => setSelectedCompetition(code)}
      />

      {/* 5-Year History Downloader Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        downloadState={historyState}
        apiFootballQuota={apiFootballQuota}
        onStartDownload={handleStartHistoryDownload}
        onPauseDownload={handlePauseHistoryDownload}
        onViewSeasonMatches={(code, season, name) => {
          setSelectedHistoricalView({ code, season, name });
        }}
      />

      {/* Season Historical Matches Viewer */}
      {selectedHistoricalView && (
        <SeasonViewerModal
          isOpen={!!selectedHistoricalView}
          onClose={() => setSelectedHistoricalView(null)}
          competitionCode={selectedHistoricalView.code}
          season={selectedHistoricalView.season}
          competitionName={selectedHistoricalView.name}
          onSelectTeam={(name) => setSelectedClubName(name)}
        />
      )}

      {/* TheSportsDB Club Details Modal */}
      <ClubDetailsModal
        isOpen={!!selectedClubName}
        onClose={() => setSelectedClubName(null)}
        teamName={selectedClubName || ''}
      />
    </div>
  );
}
