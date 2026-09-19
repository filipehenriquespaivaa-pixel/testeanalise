import React, { useState } from 'react';
import { HistoryDownloadState, HistoryTaskItem, ApiFootballQuota, COVERED_COMPETITIONS } from '../types';
import { Download, CheckCircle2, Pause, Play, Database, Eye, ShieldAlert, Sparkles, Search } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadState: HistoryDownloadState | null;
  apiFootballQuota?: ApiFootballQuota | null;
  onStartDownload: (competitionCode?: string) => void;
  onPauseDownload: () => void;
  onViewSeasonMatches: (code: string, season: number, compName: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  downloadState,
  apiFootballQuota,
  onStartDownload,
  onPauseDownload,
  onViewSeasonMatches
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [compFilter, setCompFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const items = downloadState?.items || [];
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const notAvailableCount = items.filter((i) => i.status === 'not_available').length;
  const isRunning = downloadState?.isRunning ?? false;
  const total = items.length;

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'COMPLETED' && item.status !== 'completed') return false;
    if (selectedFilter === 'PENDING' && (item.status === 'completed' || item.status === 'not_available')) return false;
    if (compFilter !== 'ALL' && item.competitionCode !== compFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComp = item.competitionName.toLowerCase().includes(q) || item.competitionCode.toLowerCase().includes(q);
      if (!matchComp) return false;
    }
    return true;
  });

  const percentComplete = total > 0 ? Math.round(((completedCount + notAvailableCount) / total) * 100) : 0;
  const quotaRemaining = apiFootballQuota?.remaining ?? (downloadState?.apiFootballQuota?.remaining ?? 100);
  const quotaLimit = apiFootballQuota?.limit_day ?? 100;
  const quotaUsed = apiFootballQuota?.current ?? (quotaLimit - quotaRemaining);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-base font-bold text-white">
                  Histórico de 5 Anos (2020 a 2024)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  20 Competições
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Fonte: API-Football
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                1 requisição = 1 temporada inteira salva permanentemente no seu disco local.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quota & Progress Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50 space-y-4">
          {/* Quota HUD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Temporadas Salvas
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {completedCount} <span className="text-xs text-slate-500 font-normal">/ {total}</span>
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {percentComplete}%
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Cota API-Football Hoje
                </span>
                <span className="text-lg font-bold text-sky-300 font-mono">
                  {quotaRemaining} <span className="text-xs text-slate-500 font-normal">/ {quotaLimit} restantes</span>
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                {quotaUsed} usadas
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Status do Processo
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate block max-w-[150px]">
                  {isRunning ? 'Em andamento...' : completedCount === total ? 'Concluído' : 'Pronto para baixar'}
                </span>
              </div>
              {isRunning ? (
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="text-xs text-slate-300 truncate">
              {isRunning ? (
                <span className="text-emerald-400 font-medium animate-pulse">
                  {downloadState?.currentLabel || 'Baixando temporadas em ritmo seguro (~4s)...'}
                </span>
              ) : completedCount === total ? (
                <span className="text-emerald-400 font-medium">
                  Todas as 100 temporadas estão salvas e prontas para consulta offline!
                </span>
              ) : (
                <span className="text-slate-400">
                  Clique para iniciar o download sequencial. Você pode pausar a qualquer momento.
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isRunning ? (
                <button
                  onClick={onPauseDownload}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-500 shadow-sm transition-all"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartDownload()}
                  disabled={completedCount === total || quotaRemaining <= 3}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    completedCount === total || quotaRemaining <= 3
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Iniciar Fila Completa</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
            <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
              <span className="text-slate-500 font-medium text-[11px] uppercase">Status:</span>
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'ALL'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({total})
              </button>
              <button
                onClick={() => setSelectedFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'COMPLETED'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Salvas ({completedCount})
              </button>
              <button
                onClick={() => setSelectedFilter('PENDING')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'PENDING'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pendentes ({total - completedCount - notAvailableCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar torneio..."
                className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-44"
              />
            </div>
          </div>
        </div>

        {/* List of competition items */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const isDone = item.status === 'completed';
              const isCurDownloading = item.status === 'downloading';
              const isUnavailable = item.status === 'not_available';
              const isErr = item.status === 'error';
              const compMeta = COVERED_COMPETITIONS.find((c) => c.code === item.competitionCode);

              return (
                <div
                  key={`${item.competitionCode}_${item.season}`}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isCurDownloading
                      ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : isDone
                      ? 'bg-slate-850/70 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/40 border-slate-800/60 opacity-85'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm border border-slate-700/60 flex-shrink-0">
                      {compMeta?.flagEmoji || '⚽'}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                        <span className="text-xs font-semibold text-white truncate max-w-[170px]" title={item.competitionName}>
                          {compMeta?.ptName || item.competitionName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.season}
                        </span>
                        <span className="text-[9px] font-mono px-1 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          AF
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                        {isDone
                          ? `${item.matchCount} jogos baixados • Salvo em disco`
                          : isCurDownloading
                          ? 'Baixando temporada...'
                          : isUnavailable
                          ? 'Não disputada ou sem partidas registradas'
                          : isErr
                          ? item.error || 'Erro na consulta'
                          : 'Aguardando na fila'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                    {isDone ? (
                      <button
                        onClick={() => {
                          onViewSeasonMatches(item.competitionCode, item.season, item.competitionName);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center space-x-1 transition-colors"
                        title="Ver jogos desta temporada"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                    ) : isCurDownloading ? (
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : isUnavailable ? (
                      <span className="text-[10px] text-slate-500 italic">N/A</span>
                    ) : (
                      <button
                        onClick={() => onStartDownload(item.competitionCode)}
                        disabled={isRunning || quotaRemaining <= 3}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors"
                        title="Baixar esta competição"
                      >
                        Baixar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
