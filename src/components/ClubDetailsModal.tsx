import React, { useState, useEffect } from 'react';
import { TeamDetails } from '../types';
import { X, Shield, MapPin, Users, Calendar, Globe, ExternalLink, Shirt, Search, Sparkles, Database, Loader2, Award } from 'lucide-react';

interface ClubDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string | null;
}

export const ClubDetailsModal: React.FC<ClubDetailsModalProps> = ({
  isOpen,
  onClose,
  teamName
}) => {
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [details, setDetails] = useState<TeamDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState<boolean>(false);

  const fetchClub = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setShowFullDesc(false);

    try {
      const res = await fetch(`/api/team-details?name=${encodeURIComponent(name.trim())}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Não foi possível encontrar dados para "${name}".`);
      }
      const data: TeamDetails = await res.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar TheSportsDB.');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && teamName) {
      setCurrentQuery(teamName);
      fetchClub(teamName);
    }
  }, [isOpen, teamName]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery.trim()) {
      fetchClub(currentQuery);
    }
  };

  const formatCapacity = (cap?: string) => {
    if (!cap) return null;
    const num = parseInt(cap, 10);
    if (isNaN(num) || num <= 0) return cap;
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-850/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">Ficha do Clube</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  TheSportsDB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Metadados oficiais, estádio, uniforme e história
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search bar inside modal */}
        <div className="p-3.5 bg-slate-950/60 border-b border-slate-800/80">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                placeholder="Pesquisar outro clube (ex: Real Madrid, Santos, Liverpool)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !currentQuery.trim()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-all shadow-sm flex items-center space-x-1"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Buscar</span>}
            </button>
          </form>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">
                Consultando TheSportsDB com chave 123...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Clube não encontrado</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {error} Você pode tentar buscar pelo nome em inglês ou sem siglas (ex: "Arsenal", "Barcelona", "Flamengo").
              </p>
            </div>
          ) : details ? (
            <div className="space-y-5">
              {/* Banner / Hero header */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                {details.banner ? (
                  <div className="h-32 sm:h-40 w-full overflow-hidden relative">
                    <img
                      src={details.banner}
                      alt={details.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  </div>
                ) : (
                  <div className="h-24 sm:h-28 w-full bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950" />
                )}

                {/* Club Identity overlay */}
                <div className="p-4 sm:p-5 flex items-end space-x-4 -mt-12 sm:-mt-14 relative z-10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-slate-700/80 p-2 shadow-xl flex items-center justify-center flex-shrink-0">
                    {details.badge ? (
                      <img
                        src={details.badge}
                        alt={details.name}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Shield className="w-10 h-10 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 truncate pb-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                        {details.name}
                      </h3>
                      {details.shortName && details.shortName !== details.name && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-purple-300 border border-slate-700">
                          {details.shortName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 flex-wrap gap-y-1">
                      {details.league && <span>{details.league}</span>}
                      {details.league && details.country && <span>•</span>}
                      {details.country && <span>{details.country}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges & Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {details.formedYear && (
                  <div className="p-3 rounded-2xl bg-slate-850/60 border border-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fundação</span>
                      <span className="text-xs font-bold text-white font-mono">{details.formedYear}</span>
                    </div>
                  </div>
                )}

                {details.stadium && (
                  <div className="p-3 rounded-2xl bg-slate-850/60 border border-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estádio</span>
                      <span className="text-xs font-bold text-white truncate block" title={details.stadium}>
                        {details.stadium}
                      </span>
                    </div>
                  </div>
                )}

                {details.stadiumCapacity && (
                  <div className="p-3 rounded-2xl bg-slate-850/60 border border-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capacidade</span>
                      <span className="text-xs font-bold text-white font-mono">
                        {formatCapacity(details.stadiumCapacity)}
                      </span>
                    </div>
                  </div>
                )}

                {details.jersey && (
                  <div className="p-3 rounded-2xl bg-slate-850/60 border border-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                      <Shirt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Uniforme</span>
                      <span className="text-xs font-bold text-emerald-400 font-medium">Oficial</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Jersey Uniform Card (if available) */}
              {details.jersey && (
                <div className="p-4 rounded-2xl bg-slate-850/40 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Shirt className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Manto / Uniforme Oficial</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Kit de jogo cadastrado no acervo do TheSportsDB
                    </p>
                  </div>
                  <div className="h-16 w-16 p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <img
                      src={details.jersey}
                      alt="Uniforme"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Club Biography / History */}
              {(details.descriptionPT || details.descriptionEN) && (
                <div className="p-4 rounded-2xl bg-slate-850/40 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">História & Perfil</span>
                    <span className="text-[10px] text-slate-500">
                      {details.descriptionPT ? 'Português' : 'Inglês'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {showFullDesc
                      ? (details.descriptionPT || details.descriptionEN)
                      : (details.descriptionPT || details.descriptionEN)?.slice(0, 320) + '...'}
                  </p>
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {showFullDesc ? 'Ver menos' : 'Ler história completa'}
                  </button>
                </div>
              )}

              {/* Official Links */}
              <div className="flex items-center flex-wrap gap-2 pt-1">
                {details.website && (
                  <a
                    href={details.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>Site Oficial</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
                {details.instagram && (
                  <a
                    href={details.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <span>Instagram</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
                {details.twitter && (
                  <a
                    href={details.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <span>Twitter / X</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
                {details.youtube && (
                  <a
                    href={details.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
              </div>

              {/* Cache status footer note */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {details.fromCache
                      ? 'Ficha salva no seu disco local (0 requisições gastas)'
                      : 'Carregado via TheSportsDB (Chave 123 • 30 req/min)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-purple-400 font-semibold">
                  TheSportsDB
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
