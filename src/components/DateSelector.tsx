import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onSelectDate
}) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const shiftDate = (offsetDays: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + offsetDays);
    const newStr = d.toISOString().split('T')[0];
    onSelectDate(newStr);
  };

  const getQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getTodayStr();
  const yesterdayStr = getQuickDate(-1);
  const tomorrowStr = getQuickDate(1);

  // Format date nicely in Portuguese
  const formatFriendlyDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      full: formattedDate
    };
  };

  const { weekday, full } = formatFriendlyDate(selectedDate);
  const isToday = selectedDate === todayStr;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Current Date Display */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => shiftDate(-1)}
            title="Dia anterior"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white text-base sm:text-lg">
                  {weekday}
                </span>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Hoje
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">{full}</p>
            </div>
          </div>

          <button
            onClick={() => shiftDate(1)}
            title="Próximo dia"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Date Pills & Date Picker */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => onSelectDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedDate === yesterdayStr
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            Ontem
          </button>

          <button
            onClick={() => onSelectDate(todayStr)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
              selectedDate === todayStr
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            Hoje
            {selectedDate !== todayStr && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            )}
          </button>

          <button
            onClick={() => onSelectDate(tomorrowStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedDate === tomorrowStr
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            Amanhã
          </button>

          {/* Date Picker Input */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onSelectDate(e.target.value);
              }}
              className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-slate-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
