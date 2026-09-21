import React, { useState } from 'react';
import { X, Image, Download } from 'lucide-react';
import { Trip } from '../types';
import { exportItineraryPosterPNG } from '../utils/canvasExport';
import { ItineraryEditor } from './ItineraryEditor';

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onUpdateTripItinerary: (newItinerary: string) => void;
  onShowToast: (msg: string) => void;
}

export const ItineraryModal: React.FC<ItineraryModalProps> = ({
  isOpen,
  onClose,
  trip,
  onUpdateTripItinerary,
  onShowToast,
}) => {
  if (!isOpen || !trip) return null;

  const [itineraryText, setItineraryText] = useState(trip.itinerary || '');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleSave = () => {
    onUpdateTripItinerary(itineraryText);
    onShowToast('Itinerary berhasil diperbarui');
    onClose();
  };

  const handleExportPNG = async (ratio: '4:5' | '9:16') => {
    setIsExporting(ratio);
    onShowToast(`Membuat pamflet itinerary (${ratio})...`);
    try {
      // Create a shallow copy with current updated itinerary text
      const tripCopy: Trip = { ...trip, itinerary: itineraryText };
      await exportItineraryPosterPNG(tripCopy, ratio);
      onShowToast(`Poster Itinerary (${ratio}) berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal membuat poster itinerary');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-4xl rounded-xl shadow-xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0f172a] px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-emerald-400 uppercase font-['Montserrat']">
              Rundown & Arsip Media Sosial
            </span>
            <h2 className="text-base sm:text-lg font-bold font-['Montserrat'] tracking-tight text-white">
              🗓️ Itinerary {trip.nama_gunung} ({trip.jalur})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <ItineraryEditor
            value={itineraryText}
            onChange={setItineraryText}
            namaGunung={trip.nama_gunung}
            jalur={trip.jalur}
            tanggalMulai={trip.tanggal_mulai}
            tanggalSelesai={trip.tanggal_selesai}
            onShowToast={onShowToast}
          />

          {/* Export Action Bar specifically for Itinerary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 font-['Montserrat'] tracking-tight">
                <Image className="w-4 h-4 text-[#1e4916]" />
                Export Poster Pamflet Itinerary
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Pilih format rasio postingan untuk Instagram Feed atau Instagram Story
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleExportPNG('4:5')}
                disabled={isExporting !== null}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG (4:5 Feed)</span>
              </button>

              <button
                onClick={() => handleExportPNG('9:16')}
                disabled={isExporting !== null}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1e4916] hover:bg-[#15340f] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG (9:16 Story)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 text-xs sm:text-sm font-bold text-white bg-[#1e4916] hover:bg-[#15340f] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
