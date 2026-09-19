import React, { useState } from 'react';
import { Match } from '../types';
import { Clock, Shield, MapPin, User, ChevronDown, ChevronUp } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onSelectTeam?: (name: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelectTeam }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [homeImgError, setHomeImgError] = useState<boolean>(false);
  const [awayImgError, setAwayImgError] = useState<boolean>(false);

  // Format kickoff time to user local time
  const matchDate = new Date(match.utcDate);
  const timeStr = matchDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isFinished = match.status === 'FINISHED' || match.status === 'AWARDED';
  const isPostponed = match.status === 'POSTPONED' || match.status === 'CANCELLED' || match.status === 'SUSPENDED';

  const homeScore = match.score.fullTime?.home;
  const awayScore = match.score.fullTime?.away;
  const homeHtScore = match.score.halfTime?.home;
  const awayHtScore = match.score.halfTime?.away;

  // Status label & badge
  const renderStatusBadge = () => {
    if (isLive) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{match.status === 'PAUSED' ? 'INTERVALO' : 'AO VIVO'}</span>
        </span>
      );
    }
    if (isFinished) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          ENCERRADO
        </span>
      );
    }
    if (isPostponed) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {match.status === 'POSTPONED' ? 'ADIADO' : 'CANCELADO'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
        <Clock className="w-2.5 h-2.5 text-slate-400" />
        <span>{timeStr}</span>
      </span>
    );
  };

  const stageLabel = () => {
    if (match.matchday) return `Rodada ${match.matchday}`;
    if (match.stage) {
      const map: Record<string, string> = {
        GROUP_STAGE: 'Fase de Grupos',
        ROUND_OF_16: 'Oitavas de Final',
        LAST_16: 'Oitavas de Final',
        QUARTER_FINALS: 'Quartas de Final',
        SEMI_FINALS: 'Semifinal',
        THIRD_PLACE: 'Disputa de 3º Lugar',
        FINAL: 'Final'
      };
      return map[match.stage] || match.stage.replace(/_/g, ' ');
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 shadow-sm">
      {/* Top Meta info */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-slate-800/70">
        <div className="flex items-center space-x-2 truncate">
          {match.dataSource === 'API_FOOTBALL' ? (
            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
              API-Football
            </span>
          ) : (
            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              Football-Data
            </span>
          )}
          {match.group && (
            <span className="text-[11px] font-medium text-slate-300">
              {match.group}
            </span>
          )}
          {stageLabel() && (
            <span className="text-[11px] font-medium text-slate-400">
              {stageLabel()}
            </span>
          )}
        </div>
        <div>{renderStatusBadge()}</div>
      </div>

      {/* Main Match Fixture */}
      <div className="grid grid-cols-12 items-center gap-2 py-1">
        {/* Home Team */}
        <button
          type="button"
          onClick={() => onSelectTeam?.(match.homeTeam.name)}
          title={`Ver perfil e dados de ${match.homeTeam.name} no TheSportsDB`}
          className="col-span-5 flex items-center justify-end space-x-2.5 sm:space-x-3 text-right group cursor-pointer p-1 rounded-xl hover:bg-slate-800/60 transition-all text-left"
        >
          <div className="truncate">
            <h3
              className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors truncate"
              title={match.homeTeam.name}
            >
              {match.homeTeam.shortName || match.homeTeam.name}
            </h3>
            {match.homeTeam.tla && (
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block sm:hidden">
                {match.homeTeam.tla}
              </span>
            )}
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 p-1.5 flex-shrink-0 flex items-center justify-center border border-slate-700/60 group-hover:border-purple-500/40 group-hover:shadow-md group-hover:shadow-purple-500/10 transition-all">
            {match.homeTeam.crest && !homeImgError ? (
              <img
                src={match.homeTeam.crest}
                alt={match.homeTeam.name}
                className="w-full h-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setHomeImgError(true)}
              />
            ) : (
              <Shield className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
            )}
          </div>
        </button>

        {/* Score or VS Badge */}
        <div className="col-span-2 flex flex-col items-center justify-center text-center">
          {isLive || isFinished ? (
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-slate-950/80 px-2 sm:px-3 py-1 rounded-xl border border-slate-800">
              <span
                className={`text-base sm:text-lg font-bold font-mono ${
                  match.score.winner === 'HOME_TEAM'
                    ? 'text-emerald-400'
                    : 'text-slate-100'
                }`}
              >
                {homeScore ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-mono">:</span>
              <span
                className={`text-base sm:text-lg font-bold font-mono ${
                  match.score.winner === 'AWAY_TEAM'
                    ? 'text-emerald-400'
                    : 'text-slate-100'
                }`}
              >
                {awayScore ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 tracking-wider">
                VS
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                {timeStr}
              </span>
            </div>
          )}

          {/* Half time note if finished */}
          {isFinished && homeHtScore !== null && awayHtScore !== null && (
            <span className="text-[10px] text-slate-500 font-mono mt-1">
              (1ºT {homeHtScore}-{awayHtScore})
            </span>
          )}
        </div>

        {/* Away Team */}
        <button
          type="button"
          onClick={() => onSelectTeam?.(match.awayTeam.name)}
          title={`Ver perfil e dados de ${match.awayTeam.name} no TheSportsDB`}
          className="col-span-5 flex items-center justify-start space-x-2.5 sm:space-x-3 text-left group cursor-pointer p-1 rounded-xl hover:bg-slate-800/60 transition-all"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 p-1.5 flex-shrink-0 flex items-center justify-center border border-slate-700/60 group-hover:border-purple-500/40 group-hover:shadow-md group-hover:shadow-purple-500/10 transition-all">
            {match.awayTeam.crest && !awayImgError ? (
              <img
                src={match.awayTeam.crest}
                alt={match.awayTeam.name}
                className="w-full h-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setAwayImgError(true)}
              />
            ) : (
              <Shield className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
            )}
          </div>
          <div className="truncate">
            <h3
              className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors truncate"
              title={match.awayTeam.name}
            >
              {match.awayTeam.shortName || match.awayTeam.name}
            </h3>
            {match.awayTeam.tla && (
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block sm:hidden">
                {match.awayTeam.tla}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Expandable toggle button */}
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[200px] text-slate-500">
          {match.competition.name}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>{isExpanded ? 'Menos detalhes' : 'Mais detalhes'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-800 space-y-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Horário local
              </span>
              <span className="text-slate-200">
                {matchDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}{' '}
                às {timeStr}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                Status oficial
              </span>
              <span className="text-slate-200">{match.status}</span>
            </div>

            {match.referees && match.referees.length > 0 && (
              <div className="sm:col-span-2 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300">
                  Árbitro: {match.referees.map((r) => r.name).join(', ')}
                  {match.referees[0].nationality && ` (${match.referees[0].nationality})`}
                </span>
              </div>
            )}

            {match.venue && (
              <div className="sm:col-span-2 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300">Estádio: {match.venue}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
