import React, { useState } from 'react';
import { Match } from '../types';
import { ArrowLeft, Calendar, Shield, Trophy } from 'lucide-react';

interface SeasonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionCode: string;
  season: number;
  competitionName: string;
  onSelectTeam?: (teamName: string) => void;
}

export const SeasonViewerModal: React.FC<SeasonViewerModalProps> = ({
  isOpen,
  onClose,
  competitionCode,
  season,
  competitionName,
  onSelectTeam
}) => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [matchdayFilter, setMatchdayFilter] = useState<string>('ALL');

  React.useEffect(() => {
    if (!isOpen || !competitionCode || !season) return;

    setLoading(true);
    setError(null);
    fetch(`/api/history/${competitionCode}/${season}`)
      .then((res) => {
        if (!res.ok) throw new Error('Dados não encontrados no servidor local.');
        return res.json();
      })
      .then((data) => {
        setMatches(data.matches || []);
        setHasLoaded(true);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao buscar dados históricos');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, competitionCode, season]);

  if (!isOpen) return null;

  // Extract matchdays
  const matchdays = Array.from(
    new Set(matches.map((m) => m.matchday).filter((md): md is number => typeof md === 'number'))
  ).sort((a, b) => a - b);

  const displayedMatches = matchdayFilter === 'ALL'
    ? matches
    : matches.filter((m) => m.matchday === parseInt(matchdayFilter, 10));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {competitionName} ({season})
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {matches.length} partidas gravadas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Histórico completo armazenado no servidor local
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

        {/* Filter bar */}
        {matchdays.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center space-x-3 overflow-x-auto text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">Rodada:</span>
            <button
              onClick={() => setMatchdayFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                matchdayFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({matches.length})
            </button>
            {matchdays.map((md) => (
              <button
                key={md}
                onClick={() => setMatchdayFilter(md.toString())}
                className={`px-2.5 py-1 rounded-lg font-mono whitespace-nowrap transition-colors ${
                  matchdayFilter === md.toString()
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                R{md}
              </button>
            ))}
          </div>
        )}

        {/* Matches list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Carregando jogos salvos...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-xs">
              <p>{error}</p>
            </div>
          ) : displayedMatches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>Nenhuma partida encontrada nesta rodada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedMatches.map((m) => {
                const homeScore = m.score?.fullTime?.home ?? '-';
                const awayScore = m.score?.fullTime?.away ?? '-';
                const dateFormatted = new Date(m.utcDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-slate-850/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800/50 pb-1.5">
                      <span>{dateFormatted} {m.matchday ? `• Rodada ${m.matchday}` : ''}</span>
                      <span className="font-mono text-slate-400 font-semibold">{m.status}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => m.homeTeam?.name && onSelectTeam?.(m.homeTeam.name)}
                          title={`Ver detalhes de ${m.homeTeam?.name} no TheSportsDB`}
                          className="flex items-center space-x-2 truncate group hover:text-purple-300 text-left transition-colors cursor-pointer"
                        >
                          {m.homeTeam?.crest && (
                            <img
                              src={m.homeTeam.crest}
                              alt=""
                              className="w-4 h-4 object-contain flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                            {m.homeTeam?.name}
                          </span>
                        </button>
                        <span className="text-xs font-bold font-mono text-emerald-400 ml-2">
                          {homeScore}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => m.awayTeam?.name && onSelectTeam?.(m.awayTeam.name)}
                          title={`Ver detalhes de ${m.awayTeam?.name} no TheSportsDB`}
                          className="flex items-center space-x-2 truncate group hover:text-purple-300 text-left transition-colors cursor-pointer"
                        >
                          {m.awayTeam?.crest && (
                            <img
                              src={m.awayTeam.crest}
                              alt=""
                              className="w-4 h-4 object-contain flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                            {m.awayTeam?.name}
                          </span>
                        </button>
                        <span className="text-xs font-bold font-mono text-emerald-400 ml-2">
                          {awayScore}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
