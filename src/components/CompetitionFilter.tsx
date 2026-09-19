import React from 'react';
import { COVERED_COMPETITIONS, Match } from '../types';

interface CompetitionFilterProps {
  selectedCompetition: string;
  onSelectCompetition: (code: string) => void;
  matches: Match[];
}

export const CompetitionFilter: React.FC<CompetitionFilterProps> = ({
  selectedCompetition,
  onSelectCompetition,
  matches
}) => {
  // Count matches per competition code for current day
  const matchCountByCode = matches.reduce<Record<string, number>>((acc, match) => {
    const code = match.competition?.code;
    if (code) {
      acc[code] = (acc[code] || 0) + 1;
    }
    return acc;
  }, {});

  // Identify any additional competitions returned by the API
  const extraCompetitions = Array.from(
    new Set(
      matches
        .map((m) => m.competition?.code)
        .filter((code): code is string => Boolean(code) && !COVERED_COMPETITIONS.some((c) => c.code === code))
    )
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Competições Cobertas ({COVERED_COMPETITIONS.length})
        </h2>
        {selectedCompetition !== 'ALL' && (
          <button
            onClick={() => onSelectCompetition('ALL')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {/* All Competitions Pill */}
        <button
          onClick={() => onSelectCompetition('ALL')}
          className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            selectedCompetition === 'ALL'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
          }`}
        >
          <span>🌐</span>
          <span>Todas</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              selectedCompetition === 'ALL'
                ? 'bg-emerald-700/60 text-emerald-100'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {matches.length}
          </span>
        </button>

        {/* 12 Covered Competitions */}
        {COVERED_COMPETITIONS.map((comp) => {
          const count = matchCountByCode[comp.code] || 0;
          const isSelected = selectedCompetition === comp.code;

          return (
            <button
              key={comp.code}
              onClick={() => onSelectCompetition(comp.code)}
              className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 font-semibold'
                  : count > 0
                  ? 'bg-slate-900 text-slate-200 hover:bg-slate-800 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-850 hover:text-slate-200 border-slate-800/80 opacity-75'
              }`}
            >
              <span className="text-sm">{comp.flagEmoji}</span>
              <span className="truncate max-w-[130px]" title={comp.ptName}>
                {comp.code} - {comp.name}
              </span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-emerald-700/80 text-white'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Extra competitions if present */}
        {extraCompetitions.map((code) => {
          const sampleMatch = matches.find((m) => m.competition?.code === code);
          const name = sampleMatch?.competition?.name || code;
          const count = matchCountByCode[code] || 0;
          const isSelected = selectedCompetition === code;

          return (
            <button
              key={code}
              onClick={() => onSelectCompetition(code)}
              className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700'
              }`}
            >
              <span>⚽</span>
              <span className="truncate max-w-[120px]">{name}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
