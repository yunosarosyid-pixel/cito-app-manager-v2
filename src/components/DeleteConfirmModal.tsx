import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Trip } from '../types';

interface DeleteConfirmModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  trip,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0f172a] px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base font-['Montserrat'] tracking-tight">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Konfirmasi Hapus Trip</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs sm:text-sm text-slate-700">
            Apakah Anda yakin ingin menghapus arsip trip ini?
          </p>

          <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 text-xs space-y-1">
            <p className="font-bold text-sm text-rose-950 font-['Montserrat']">
              🏔 {trip.nama_gunung} {trip.ketinggian_mdpl ? `(${trip.ketinggian_mdpl})` : ''}
            </p>
            <p className="text-slate-700">Jalur: <span className="font-semibold text-slate-900">{trip.jalur}</span></p>
            <p className="text-slate-700">Status: <span className="font-semibold text-slate-900">{trip.status}</span></p>
          </div>

          <p className="text-[11px] text-slate-500">
            Data pamflet dan itinerary untuk trip ini akan dihapus dari penyimpanan perangkat Anda.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm(trip.id);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
