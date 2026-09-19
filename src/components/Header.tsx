import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, ShieldAlert, Database, Clock, Sparkles } from 'lucide-react';
import { RateLimitInfo, ApiFootballQuota } from '../types';

interface HeaderProps {
  rateLimit: RateLimitInfo | null;
  apiFootballQuota?: ApiFootballQuota | null;
  isCached: boolean;
  cachedAt?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenHistory?: () => void;
  onOpenClubSearch?: () => void;
  historyDownloadCount?: { completed: number; total: number; isRunning: boolean };
}

export const Header: React.FC<HeaderProps> = ({
  rateLimit,
  apiFootballQuota,
  isCached,
  cachedAt,
  isLoading,
  onRefresh,
  onOpenHistory,
  onOpenClubSearch,
  historyDownloadCount
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshClick = () => {
    if (cooldown > 0 || isLoading) return;
    onRefresh();
    setCooldown(5); // 5-second button cooldown to protect rate limit
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const remaining = rateLimit?.remaining ?? 10;
  const isLimited = rateLimit?.isRateLimited ?? false;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <span className="text-xl">⚽</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                  Jogos do Dia
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Triple API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                20 competições com histórico de 5 anos e fichas TheSportsDB
              </p>
            </div>
          </div>

          {/* Right Action & Rate limit controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            {/* Real-time Clock */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{currentTime || '--:--:--'}</span>
            </div>

            {/* Cache Badge */}
            {isCached ? (
              <div
                title={cachedAt ? `Cache salvo em: ${new Date(cachedAt).toLocaleTimeString('pt-BR')}` : 'Dados em cache'}
                className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-300"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-medium hidden sm:inline">Cache</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium hidden sm:inline">Ao vivo</span>
              </div>
            )}

            {/* Football-Data Rate limit status pill */}
            <div
              title="Cota Football-Data.org: 10 requisições por minuto"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isLimited
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  : remaining <= 2
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700/70 text-slate-300'
              }`}
            >
              {isLimited ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
              <span className="font-mono text-[11px]">
                {isLimited
                  ? `FD: Pausa (${rateLimit?.resetSeconds || 60}s)`
                  : `FD: ${remaining}/10 min`}
              </span>
            </div>

            {/* API-Football Quota status pill */}
            {apiFootballQuota && (
              <div
                title="Cota API-Football: 100 requisições diárias gratuitas"
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                  apiFootballQuota.remaining <= 10
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : apiFootballQuota.remaining <= 25
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="font-mono text-[11px]">
                  AF: {apiFootballQuota.remaining}/{apiFootballQuota.limit_day} dia
                </span>
              </div>
            )}

            {/* TheSportsDB status pill & Club Search button */}
            <button
              type="button"
              onClick={onOpenClubSearch}
              title="TheSportsDB (Chave 123): 30 requisições por minuto. Clique para abrir a ficha de qualquer clube com estádio, capacidade e uniforme."
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-950/50 hover:bg-purple-900/50 text-purple-300 text-xs font-medium transition-colors active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-[11px]">TSDB: 30/min</span>
            </button>

            {/* Histórico 5 Anos Button */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 shadow-sm transition-all active:scale-95"
                title="Baixar e consultar histórico de 5 anos das 20 competições"
              >
                <Database className={`w-3.5 h-3.5 text-emerald-400 ${historyDownloadCount?.isRunning ? 'animate-bounce' : ''}`} />
                <span>Histórico (5 Anos)</span>
                {historyDownloadCount && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                    {historyDownloadCount.completed}/{historyDownloadCount.total}
                  </span>
                )}
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefreshClick}
              disabled={isLoading || cooldown > 0 || isLimited}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                isLoading || cooldown > 0 || isLimited
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {isLoading
                  ? 'Buscando...'
                  : cooldown > 0
                  ? `${cooldown}s`
                  : 'Atualizar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
