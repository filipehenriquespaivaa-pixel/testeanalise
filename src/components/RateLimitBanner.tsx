import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Info } from 'lucide-react';
import { RateLimitInfo } from '../types';

interface RateLimitBannerProps {
  rateLimit: RateLimitInfo;
  onRetry: () => void;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({
  rateLimit,
  onRetry
}) => {
  const [secondsLeft, setSecondsLeft] = useState(rateLimit.resetSeconds || 60);

  useEffect(() => {
    setSecondsLeft(rateLimit.resetSeconds || 60);
  }, [rateLimit.resetSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  return (
    <div className="bg-rose-950/80 border border-rose-500/40 rounded-2xl p-4 text-rose-200 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Limite de 10 Requisições / Minuto Atingido
            </h4>
            <p className="text-xs text-rose-300 mt-0.5">
              Sua chave Football-Data.org é do plano gratuito (Free Tier). O sistema protegeu sua conta para evitar erros e liberará novas chamadas automaticamente.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">
              Desbloqueio em
            </span>
            <span className="text-base font-mono font-bold text-white">
              {secondsLeft}s
            </span>
          </div>
          <button
            onClick={onRetry}
            disabled={secondsLeft > 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              secondsLeft > 0
                ? 'bg-rose-900/60 text-rose-400 border border-rose-800 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Agora</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-rose-900/50 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-rose-500 h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${Math.max(0, 100 - (secondsLeft / 60) * 100)}%` }}
        />
      </div>
    </div>
  );
};
