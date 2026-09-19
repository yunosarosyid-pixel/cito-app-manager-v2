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
      <div className="bg-white border-2 border-rose-600 text-gray-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-600 px-5 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base font-['Montserrat'] tracking-tight">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span>Konfirmasi Hapus Trip</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-rose-700 rounded transition-colors text-white/90 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-800">
            Apakah Anda yakin ingin menghapus arsip trip ini?
          </p>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs space-y-1">
            <p className="font-extrabold text-sm text-rose-900 font-['Montserrat']">
              🏔 {trip.nama_gunung} {trip.ketinggian_mdpl ? `(${trip.ketinggian_mdpl})` : ''}
            </p>
            <p className="text-gray-700">Jalur: <span className="font-semibold">{trip.jalur}</span></p>
            <p className="text-gray-700">Status: <span className="font-semibold">{trip.status}</span></p>
          </div>

          <p className="text-[11px] text-gray-500">
            *Semua data pamflet dan itinerary untuk trip ini akan dihapus dari penyimpanan perangkat Anda.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm(trip.id);
              onClose();
            }}
            className="px-4 py-2 rounded text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
