import React from 'react';
import { COVERED_COMPETITIONS, CoveredCompetitionDef } from '../types';
import { Trophy, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface CoveredCompetitionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompetition: (code: string) => void;
}

export const CoveredCompetitionsModal: React.FC<CoveredCompetitionsModalProps> = ({
  isOpen,
  onClose,
  onSelectCompetition
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                20 Competições Cobertas
              </h3>
              <p className="text-xs text-slate-400">
                Integração Dual: Football-Data.org + API-Football com dados históricos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COVERED_COMPETITIONS.map((comp: CoveredCompetitionDef) => (
              <div
                key={comp.code}
                onClick={() => {
                  onSelectCompetition(comp.code);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{comp.flagEmoji}</span>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700">
                        {comp.code}
                      </span>
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                        {comp.ptName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-slate-400">
                        {comp.country}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${
                          comp.dataSource === 'DUAL'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {comp.dataSourceLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Filtrar →
                </span>
              </div>
            ))}
          </div>

          {/* Info note */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">
                Arquitetura Dual de Fontes de Dados
              </p>
              <p className="mt-1 leading-relaxed">
                • <strong>Football-Data.org</strong> (10 req/min): alimenta os placares e jogos diários das ligas principais para manter seus dados ao vivo sem gastar sua cota diária.<br/>
                • <strong>API-Football</strong> (100 req/dia): alimenta o histórico de 5 anos (1 requisição traz todos os jogos do ano) e cobre torneios adicionais como Brasileirão Série B, Libertadores, Copa do Brasil e copas sul-americanas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
