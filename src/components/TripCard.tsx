import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Trip } from '../types';
import { formatDateRange } from '../utils/formatters';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
  onEdit?: (trip: Trip) => void;
  onDelete?: (trip: Trip) => void;
  onOpenItinerary?: (trip: Trip) => void;
  isSelected?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onSelect,
  isSelected,
}) => {
  // Format title like: "Gunung Sumbing 3371 Mdpl"
  const formatTitle = () => {
    const name = trip.nama_gunung || '';
    const rawHeight = (trip.ketinggian_mdpl || '').replace(/[().]/g, '').trim();
    if (!rawHeight) return name;
    if (name.toLowerCase().includes(rawHeight.toLowerCase())) return name;

    const cleanHeight = rawHeight.replace(/mdpl/i, 'Mdpl');
    return `${name} ${cleanHeight}`;
  };

  const jalurText = trip.jalur?.startsWith('Via ') ? trip.jalur : `Via ${trip.jalur || 'Jalur Terbuka'}`;
  const formattedDate = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai) || '';

  return (
    <div
      onClick={() => onSelect(trip)}
      className={`group relative rounded-xl p-3 sm:p-3.5 transition-all duration-150 cursor-pointer border ${
        isSelected
          ? 'bg-white border-slate-300 border-l-4 border-l-[#1e4916] shadow-sm'
          : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Row: Mountain Name & Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3
              className={`text-sm font-['Montserrat'] truncate transition-colors ${
                isSelected
                  ? 'text-[#1e4916] font-bold tracking-tight'
                  : 'text-slate-800 font-semibold group-hover:text-slate-900'
              }`}
            >
              {formatTitle()}
            </h3>

            {/* Badges */}
            <div className="flex items-center gap-1 shrink-0">
              {trip.is_draft ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  DRAFT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  FINAL
                </span>
              )}

              {trip.from_team ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  TIM
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          {/* Sub Row: Jalur & Date */}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0">
              {jalurText}
            </span>

            {formattedDate && (
              <span className="font-['Montserrat'] text-[11px] font-medium text-slate-600">
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className={`w-4 h-4 transition-all shrink-0 mt-0.5 ${
            isSelected
              ? 'text-[#1e4916] translate-x-0.5'
              : 'text-slate-300 group-hover:text-slate-500'
          }`}
        />
      </div>
    </div>
  );
};
