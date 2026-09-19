import React, { useState } from 'react';
import { Match, COVERED_COMPETITIONS } from '../types';
import { MatchCard } from './MatchCard';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';

interface CompetitionSectionProps {
  competitionCode: string;
  competitionName: string;
  competitionEmblem?: string;
  matches: Match[];
  onSelectTeam?: (teamName: string) => void;
}

export const CompetitionSection: React.FC<CompetitionSectionProps> = ({
  competitionCode,
  competitionName,
  competitionEmblem,
  matches,
  onSelectTeam
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [emblemError, setEmblemError] = useState(false);

  // Match info from COVERED_COMPETITIONS definition
  const coveredDef = COVERED_COMPETITIONS.find((c) => c.code === competitionCode);

  const displayName = coveredDef ? coveredDef.ptName : competitionName;
  const flagEmoji = coveredDef ? coveredDef.flagEmoji : '⚽';

  return (
    <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
      {/* Section Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-4 py-3.5 bg-slate-850/80 hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-between border-b border-slate-800/60 select-none"
      >
        <div className="flex items-center space-x-3">
          {/* Emblem or Flag */}
          <div className="w-8 h-8 rounded-lg bg-slate-800 p-1 flex items-center justify-center border border-slate-700/60 flex-shrink-0">
            {competitionEmblem && !emblemError ? (
              <img
                src={competitionEmblem}
                alt={competitionName}
                className="w-full h-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setEmblemError(true)}
              />
            ) : (
              <span className="text-base">{flagEmoji}</span>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {displayName}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                {competitionCode}
              </span>
              {coveredDef && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    coveredDef.dataSource === 'DUAL'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {coveredDef.dataSource === 'DUAL' ? '⚡ ' : '🌐 '}
                  {coveredDef.dataSourceLabel}
                </span>
              )}
            </div>
            {coveredDef && (
              <p className="text-xs text-slate-400 mt-0.5">
                {coveredDef.country}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {matches.length} {matches.length === 1 ? 'jogo' : 'jogos'}
          </span>
          <button className="text-slate-400 hover:text-white p-1">
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Match cards grid */}
      {!isCollapsed && (
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onSelectTeam={onSelectTeam}
            />
          ))}
        </div>
      )}
    </section>
  );
};
