import React from 'react';
import { Search, Flame, Clock, CheckCircle2, ListFilter } from 'lucide-react';

export type MatchStatusFilter = 'ALL' | 'LIVE' | 'SCHEDULED' | 'FINISHED';

interface StatusAndSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: MatchStatusFilter;
  onStatusChange: (status: MatchStatusFilter) => void;
  counts: {
    all: number;
    live: number;
    scheduled: number;
    finished: number;
  };
}

export const StatusAndSearchFilter: React.FC<StatusAndSearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  counts
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar clube (ex: Corinthians, Real Madrid, Arsenal)..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-slate-700 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => onStatusChange('ALL')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            statusFilter === 'ALL'
              ? 'bg-slate-700 text-white border-slate-600'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Todos</span>
          <span className="text-[10px] opacity-75">({counts.all})</span>
        </button>

        <button
          onClick={() => onStatusChange('LIVE')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            statusFilter === 'LIVE'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
              : counts.live > 0
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {counts.live > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Ao Vivo</span>
          <span className="text-[10px] opacity-80">({counts.live})</span>
        </button>

        <button
          onClick={() => onStatusChange('SCHEDULED')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            statusFilter === 'SCHEDULED'
              ? 'bg-sky-600 text-white border-sky-500'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Agendados</span>
          <span className="text-[10px] opacity-75">({counts.scheduled})</span>
        </button>

        <button
          onClick={() => onStatusChange('FINISHED')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            statusFilter === 'FINISHED'
              ? 'bg-purple-600 text-white border-purple-500'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Finalizados</span>
          <span className="text-[10px] opacity-75">({counts.finished})</span>
        </button>
      </div>
    </div>
  );
};
