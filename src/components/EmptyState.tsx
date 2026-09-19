import React from 'react';
import { Calendar, Search, Trophy, ArrowRight } from 'lucide-react';
import { COVERED_COMPETITIONS } from '../types';

interface EmptyStateProps {
  selectedCompetition: string;
  searchQuery: string;
  selectedDate: string;
  onResetFilters: () => void;
  onGoToToday: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  selectedCompetition,
  searchQuery,
  selectedDate,
  onResetFilters,
  onGoToToday
}) => {
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const compDef = COVERED_COMPETITIONS.find((c) => c.code === selectedCompetition);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-2xl mb-4 border border-slate-700/80">
        {searchQuery ? (
          <Search className="w-6 h-6 text-slate-400" />
        ) : selectedCompetition !== 'ALL' ? (
          <Trophy className="w-6 h-6 text-slate-400" />
        ) : (
          <Calendar className="w-6 h-6 text-slate-400" />
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white mb-2">
        {searchQuery
          ? `Nenhum clube encontrado com "${searchQuery}"`
          : selectedCompetition !== 'ALL'
          ? `Nenhum jogo ${isToday ? 'hoje' : 'nesta data'} em ${compDef?.ptName || selectedCompetition}`
          : `Nenhum jogo registrado para esta data`}
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
        {searchQuery
          ? 'Tente verificar a ortografia do time ou limpar a busca para ver todas as partidas.'
          : selectedCompetition !== 'ALL'
          ? 'Esta competição pode estar sem rodadas agendadas para o dia selecionado. Você pode alternar para outra data ou ver todas as competições.'
          : 'Geralmente as rodadas europeias e nacionais se concentram entre sexta-feira, sábado, domingo e noites de meio de semana (Champions League e Libertadores).'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {(searchQuery || selectedCompetition !== 'ALL') && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Limpar Filtros
          </button>
        )}

        {!isToday && (
          <button
            onClick={onGoToToday}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
          >
            <span>Ir para Jogos de Hoje</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
