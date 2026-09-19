import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Download,
  Image,
  FileText,
  Edit3,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Sliders,
  Layers,
  Trash2,
  Share2,
  Instagram,
  Zap,
} from 'lucide-react';
import { Trip } from '../types';
import {
  formatDateRange,
  generateInstagramFeedCaption,
  generateWhatsAppBroadcastCaption,
  generateStoryQuickCaption,
} from '../utils/formatters';
import { exportTripPamphletPNG, exportItineraryPosterPNG, SlideType } from '../utils/canvasExport';
import { exportTripPDF, exportTripTXT } from '../utils/pdfExport';
import { PamphletStudioModal } from './PamphletStudioModal';
import { CaptionStudioModal } from './CaptionStudioModal';
import { getTripMediaKitUrl } from '../utils/slug';

interface TripDetailProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
  onOpenItinerary: (trip: Trip) => void;
  onShowToast: (msg: string) => void;
  onSaveTrip?: (updatedTrip: Trip) => void;
  onOpenMediaKit?: (trip: Trip) => void;
  onCopyMediaKitLink?: (trip: Trip) => void;
}

export const TripDetail: React.FC<TripDetailProps> = ({
  trip,
  onEdit,
  onDelete,
  onOpenItinerary,
  onShowToast,
  onSaveTrip,
  onOpenMediaKit,
  onCopyMediaKitLink,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioInitialSlide, setStudioInitialSlide] = useState<SlideType>('cover');
  const [isCaptionStudioOpen, setIsCaptionStudioOpen] = useState(false);
  const [activeCaptionTab, setActiveCaptionTab] = useState<'instagram' | 'whatsapp' | 'story'>('instagram');

  const previewCaptionText = useMemo(() => {
    if (activeCaptionTab === 'instagram') {
      return generateInstagramFeedCaption(trip);
    } else if (activeCaptionTab === 'whatsapp') {
      return generateWhatsAppBroadcastCaption(trip);
    } else {
      return generateStoryQuickCaption(trip);
    }
  }, [trip, activeCaptionTab]);

  const isBuka = trip.status === 'Buka';
  const dateRange = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai) || 'Jadwal Terbuka';

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(previewCaptionText);
      setCopiedCaption(true);
      onShowToast(
        activeCaptionTab === 'instagram'
          ? 'Caption Instagram berhasil disalin!'
          : activeCaptionTab === 'whatsapp'
          ? 'Pesan WhatsApp Broadcast berhasil disalin!'
          : 'Format Story singkat berhasil disalin!'
      );
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      onShowToast('Gagal menyalin teks');
    }
  };

  const handleOpenWhatsApp = () => {
    const waNumber = (trip.kontak_wa || '+6282230444428').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(previewCaptionText);
    window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
  };

  const handleExportPamphlet = async (ratio: '4:5' | '9:16') => {
    setIsExporting(`pamflet-${ratio}`);
    onShowToast(`Membuat pamflet trip (${ratio})...`);
    try {
      await exportTripPamphletPNG(trip, ratio);
      onShowToast(`Pamflet Trip (${ratio}) berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal membuat pamflet trip');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportItineraryPoster = async (ratio: '4:5' | '9:16') => {
    setIsExporting(`itin-${ratio}`);
    onShowToast(`Membuat poster itinerary (${ratio})...`);
    try {
      await exportItineraryPosterPNG(trip, ratio);
      onShowToast(`Poster Itinerary (${ratio}) berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal membuat poster itinerary');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = () => {
    try {
      exportTripPDF(trip);
      onShowToast('Arsip PDF berhasil diunduh');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal mengekspor PDF');
    }
  };

  const handleExportTXT = () => {
    try {
      exportTripTXT(trip);
      onShowToast('Arsip TXT berhasil diunduh');
    } catch (err) {
      console.error(err);
      onShowToast('Gagal mengekspor TXT');
    }
  };

  return (
    <div key={trip.id} className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300 ease-out">
      {/* Top Banner & Heading */}
      <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Badge Kesiapan: Draft (Merah Tegas) vs Final (Hijau) */}
              {trip.is_draft ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-red-600 text-white border border-red-700 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  🔴 Status: DRAFT (Belum Final)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide bg-emerald-700 text-white shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  🟢 Status: FINAL (Siap Upload)
                </span>
              )}

              {/* Badge Sumber Pembuat: Tim vs Admin */}
              {trip.from_team ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-950 bg-amber-100 border border-amber-400 px-2.5 py-1 rounded-full shadow-2xs">
                  👥 Diajukan oleh Tim {trip.draf_oleh ? `(${trip.draf_oleh})` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-[#275d1d] px-2.5 py-1 rounded-full shadow-2xs">
                  👑 Dibuat oleh Admin (Mas Yuno)
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                  isBuka
                    ? 'bg-[#275d1d] text-white'
                    : 'bg-[#d1d1d1] text-[#275d1d] border border-[#275d1d]/40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isBuka ? 'bg-white' : 'bg-[#275d1d]'}`} />
                Kuota: {trip.status}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#275d1d] bg-[#d1d1d1] px-2.5 py-1 rounded border border-[#275d1d]/30">
                <MapPin className="w-3.5 h-3.5 text-[#275d1d]" />
                {trip.jalur}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-['Montserrat'] tracking-tight text-[#275d1d]">
              🏔 {trip.nama_gunung.toUpperCase()} {trip.ketinggian_mdpl ? trip.ketinggian_mdpl.toUpperCase() : ''}
            </h2>
            <p className="text-sm font-extrabold text-[#275d1d] font-['Montserrat'] tracking-wide">
              📌 {trip.jalur.toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {trip.is_draft ? (
              <button
                onClick={() => {
                  const approved = {
                    ...trip,
                    is_draft: false,
                    from_team: trip.from_team === true,
                    updated_at: Date.now(),
                  };
                  onSaveTrip(approved);
                  const authorLabel = trip.from_team ? 'Draf Tim' : 'Draf Admin';
                  onShowToast(`${authorLabel} ${trip.nama_gunung} resmi diterbitkan ke FINAL (Siap Promosi)!`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-md active:scale-95"
                title="Klik untuk mengubah status trip menjadi Final (Siap Upload)"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span>🟢 Terbitkan Jadi Final</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const toDraft = {
                    ...trip,
                    is_draft: true,
                    from_team: trip.from_team === true,
                    updated_at: Date.now(),
                  };
                  onSaveTrip(toDraft);
                  onShowToast(`Trip ${trip.nama_gunung} dikembalikan ke DRAFT (Warna Merah).`);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-950 border border-red-400 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Klik jika ingin membatalkan status final dan mengedit ulang data ini sebagai Draf"
              >
                <span>🔴 Ubah ke Draft</span>
              </button>
            )}
            <button
              onClick={() => {
                if (onOpenMediaKit) {
                  onOpenMediaKit(trip);
                } else {
                  window.open(getTripMediaKitUrl(trip), '_blank');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0f141c] hover:bg-slate-800 text-[#e5a93c] border border-[#e5a93c]/50 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Pratinjau Media Kit sebelum kirim link ke tim"
            >
              <Sparkles className="w-4 h-4 text-[#e5a93c]" />
              <span>Pratinjau Media Kit</span>
            </button>
            <button
              onClick={() => {
                if (onCopyMediaKitLink) {
                  onCopyMediaKitLink(trip);
                } else {
                  const url = getTripMediaKitUrl(trip);
                  navigator.clipboard.writeText(url).then(() => {
                    onShowToast('🔗 Link Media Kit berhasil disalin! Siap dikirim ke WhatsApp tim.');
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-400 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Salin Link Media Kit untuk dikirimkan ke WhatsApp tim"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">Salin Link Kit</span>
            </button>
            <button
              onClick={() => onEdit(trip)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span>Edit Trip</span>
            </button>
            <button
              onClick={() => onDelete(trip)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border-2 border-rose-600 hover:bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              title="Hapus trip ini"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Trip</span>
            </button>
          </div>
        </div>

        {/* Draft Notice Banner */}
        {trip.is_draft && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-amber-900">
              <strong>Catatan Tim:</strong> Jadwal ini diinput oleh <strong>{trip.draf_oleh || 'Tim CITO'}</strong>.
              {trip.draf_catatan && <span className="block text-amber-800 mt-0.5 italic">"{trip.draf_catatan}"</span>}
            </div>
            <button
              onClick={() => {
                const approved = { ...trip, is_draft: false, from_team: true, updated_at: Date.now() };
                onSaveTrip(approved);
                onShowToast(`Trip ${trip.nama_gunung} resmi disetujui & dipublikasikan!`);
              }}
              className="px-3 py-1.5 bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              ✓ Setujui Sekarang
            </button>
          </div>
        )}

        {/* Quick Meta Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#275d1d]/20">
          <div className={`bg-[#f4f4f4] p-3 rounded-lg border border-[#275d1d]/30 ${trip.jadwal_tambahan && trip.jadwal_tambahan.length > 0 ? 'sm:col-span-2' : ''}`}>
            <span className="text-[11px] font-bold text-[#275d1d] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#275d1d]" />
              Jadwal Trip
            </span>

            {trip.jadwal_tambahan && trip.jadwal_tambahan.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900 bg-white px-2.5 py-1.5 rounded border border-[#275d1d]/20">
                  <span className="text-[#275d1d] text-sm leading-none">•</span>
                  <span>{dateRange}</span>
                </div>
                {trip.jadwal_tambahan.map((sch, i) => (
                  <div key={sch.id || i} className="flex items-center gap-2 text-xs font-bold text-gray-900 bg-white px-2.5 py-1.5 rounded border border-[#275d1d]/20">
                    <span className="text-[#275d1d] text-sm leading-none">•</span>
                    <span>{formatDateRange(sch.tanggal_mulai, sch.tanggal_selesai)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm sm:text-base font-extrabold text-gray-900 font-['Montserrat'] mt-1">
                {dateRange}
              </p>
            )}
          </div>

          {(!trip.jadwal_tambahan || trip.jadwal_tambahan.length === 0) && (
            <div className="bg-[#f4f4f4] p-3 rounded-lg border border-[#275d1d]/30">
              <span className="text-[11px] font-bold text-[#275d1d] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#275d1d]" /> Durasi Pendakian
              </span>
              <p className="text-sm sm:text-base font-extrabold text-[#275d1d] font-['Montserrat'] mt-1">
                {trip.durasi}
              </p>
            </div>
          )}

          <div className="bg-[#f4f4f4] p-3 rounded-lg border border-[#275d1d]/30">
            <span className="text-[11px] font-bold text-[#275d1d] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#275d1d]" /> Target Kuota Peserta
            </span>
            <p className="text-sm sm:text-base font-black text-gray-900 font-['Montserrat'] mt-1">
              {trip.min_peserta || '7'} / {trip.max_peserta || '20'} Pax
            </p>
            <p className="text-[11px] text-[#275d1d] font-semibold italic mt-0.5">
              *(Min Madiun: {trip.min_peserta || '7'} | Min Jakarta: {trip.min_peserta_jakarta || trip.min_peserta || '7'} | Maks: {trip.max_peserta || '20'} Pax)
            </p>
          </div>
        </div>
      </div>

      {/* Export Action Bar (PNG 4:5 & 9:16, PDF, TXT) */}
      <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#275d1d]/20 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#275d1d] uppercase tracking-wider font-['Montserrat'] flex items-center gap-2">
              <Download className="w-4 h-4 text-[#275d1d]" />
              Pusat Export Media & Arsip Trip
            </h3>
            <p className="text-xs text-gray-700 mt-0.5">
              Desain pamflet resmi Cito Adventure (Cover, Fasilitas, Rundown, Catatan Penting, & Kontak).
            </p>
          </div>

          <button
            onClick={() => {
              setStudioInitialSlide('cover');
              setIsStudioOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#275d1d] hover:bg-[#1f4a17] text-white rounded-lg text-xs sm:text-sm font-bold shadow transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Studio Desain & Edit Background</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Card Export Pamflet Feed & Story */}
          <div className="bg-[#f4f4f4] border border-[#275d1d]/30 rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#275d1d] flex items-center gap-1.5">
                <Image className="w-4 h-4 text-[#275d1d]" />
                Pamflet Cover & Slide Utama
              </span>
              <p className="text-[11px] text-gray-700 leading-snug">
                Desain resmi dengan logo Cito Adventure, judul gunung, harga start, dan floating booking bar.
              </p>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPamphlet('4:5')}
                  disabled={isExporting !== null}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-[#e4e4e4] text-[#275d1d] border-2 border-[#275d1d] rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>4:5 (Feed)</span>
                </button>
                <button
                  onClick={() => handleExportPamphlet('9:16')}
                  disabled={isExporting !== null}
                  className="flex-1 py-1.5 px-2 bg-[#275d1d] hover:bg-[#1f4a17] text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow"
                >
                  <span>9:16 (Story)</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setStudioInitialSlide('cover');
                  setIsStudioOpen(true);
                }}
                className="w-full py-1 px-2 text-[11px] font-bold text-[#275d1d] hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" /> Ganti Background / Preview
              </button>
            </div>
          </div>

          {/* Card Export Itinerary Poster */}
          <div className="bg-[#f4f4f4] border border-[#275d1d]/30 rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#275d1d] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#275d1d]" />
                Export Rundown Itinerary (Poster)
              </span>
              <p className="text-[11px] text-gray-700 leading-snug">
                Menyesuaikan desain resmi Cito Adventure: kartu transparan, rundown per hari & jam timeline.
              </p>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportItineraryPoster('4:5')}
                  disabled={isExporting !== null}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-[#e4e4e4] text-[#275d1d] border-2 border-[#275d1d] rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>4:5 (Feed)</span>
                </button>
                <button
                  onClick={() => handleExportItineraryPoster('9:16')}
                  disabled={isExporting !== null}
                  className="flex-1 py-1.5 px-2 bg-[#275d1d] hover:bg-[#1f4a17] text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow"
                >
                  <span>9:16 (Story)</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setStudioInitialSlide('itinerary');
                  setIsStudioOpen(true);
                }}
                className="w-full py-1 px-2 text-[11px] font-bold text-[#275d1d] hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <Layers className="w-3 h-3" /> Buka di Studio Pamflet
              </button>
            </div>
          </div>

          {/* Card Export Dokumen PDF & TXT */}
          <div className="bg-[#f4f4f4] border border-[#275d1d]/30 rounded-lg p-3.5 space-y-2 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#275d1d] flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#275d1d]" />
                Dokumen Arsip Cetak
              </span>
              <p className="text-[11px] text-gray-700 leading-snug">
                Simpan seluruh data ke dokumen PDF resmi atau file teks (.TXT).
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleExportPDF}
                className="flex-1 py-1.5 px-2 bg-[#275d1d] hover:bg-[#1f4a17] text-white border border-[#275d1d] rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Unduh PDF</span>
              </button>
              <button
                onClick={handleExportTXT}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-[#e4e4e4] text-[#275d1d] border-2 border-[#275d1d] rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Unduh TXT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Caption & Broadcast Marketing Generator Box */}
      <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-extrabold text-[#275d1d] font-['Montserrat'] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#275d1d]" />
              Generator Caption & Broadcast Promosi
            </h3>
            <p className="text-xs text-gray-700 mt-0.5">
              Salin teks promosi instan untuk Feed Instagram, pesan siaran WhatsApp grup, atau Story singkat.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCaptionStudioOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#f0f0f0] text-[#275d1d] border-2 border-[#275d1d] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Buka Generator Lengkap (Custom Hook)</span>
            </button>

            <button
              onClick={handleCopyCaption}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {copiedCaption ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              <span>{copiedCaption ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Buka WhatsApp langsung dengan teks ini"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white" />
              <span>Kirim ke WA</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-[#275d1d]/15 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveCaptionTab('instagram')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCaptionTab === 'instagram'
                ? 'bg-[#275d1d] text-white shadow-xs'
                : 'bg-[#f0f0f0] text-gray-700 hover:bg-[#e4e4e4]'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Feed & Reels Instagram</span>
          </button>

          <button
            onClick={() => setActiveCaptionTab('whatsapp')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCaptionTab === 'whatsapp'
                ? 'bg-[#275d1d] text-white shadow-xs'
                : 'bg-[#f0f0f0] text-gray-700 hover:bg-[#e4e4e4]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Broadcast WhatsApp Grup</span>
          </button>

          <button
            onClick={() => setActiveCaptionTab('story')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCaptionTab === 'story'
                ? 'bg-[#275d1d] text-white shadow-xs'
                : 'bg-[#f0f0f0] text-gray-700 hover:bg-[#e4e4e4]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Story & Status Singkat</span>
          </button>
        </div>

        {/* Text Preview Box */}
        <div className="bg-[#f4f4f4] border-2 border-[#275d1d]/30 rounded-lg p-4 relative font-mono text-xs text-[#193a14] font-semibold leading-relaxed whitespace-pre-wrap select-all max-h-64 overflow-y-auto">
          {previewCaptionText}
        </div>
      </div>

      {/* Meeting Point & Pricing */}
      <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 shadow-md space-y-3">
        <h3 className="text-xs font-extrabold text-[#275d1d] uppercase tracking-wider font-['Montserrat']">
          Tarif per Meeting Point (MEPO)
        </h3>
        {trip.harga_mepo && trip.harga_mepo.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {trip.harga_mepo.map((m, idx) => (
              <div key={idx} className="bg-[#f4f4f4] border border-[#275d1d]/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">{m.lokasi || 'Meeting Point'}</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#275d1d] font-['Montserrat']">
                  {m.harga || '-'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600">Belum ada data tarif meeting point.</p>
        )}
      </div>

      {/* Include & Exclude Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Include */}
        <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 shadow-md space-y-3">
          <h3 className="text-xs font-extrabold text-[#275d1d] uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#275d1d]" />
            Fasilitas Include
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-800">
            {(trip.include || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#275d1d] font-bold mt-0.5">✓</span>
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Exclude */}
        <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 shadow-md space-y-3">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-700" />
            Exclude (Tidak Termasuk)
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-800">
            {(trip.exclude || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-700 font-bold mt-0.5">✕</span>
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
          {trip.extra_porter && (
            <div className="pt-2 border-t border-[#275d1d]/20 text-xs text-[#275d1d] font-bold">
              🎒 Extra Porter: {trip.extra_porter}
            </div>
          )}
        </div>
      </div>

      {/* Itinerary Preview & Action */}
      <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-extrabold text-[#275d1d] uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#275d1d]" />
            Rundown & Itinerary Kegiatan
          </h3>
          <button
            onClick={() => onOpenItinerary(trip)}
            className="text-xs font-bold text-[#275d1d] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Editor & Export Poster Itinerary</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#275d1d]" />
          </button>
        </div>

        <div className="bg-[#f4f4f4] border border-[#275d1d]/30 rounded-lg p-4 font-mono text-xs text-gray-800 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
          {trip.itinerary || 'Belum ada rundown itinerary.'}
        </div>
      </div>

      {/* S&K & Catatan Penting */}
      <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 shadow-md space-y-4">
        {trip.sk_berlaku && trip.sk_berlaku.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-800 uppercase font-['Montserrat']">
              Syarat & Ketentuan (S&K):
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-800">
              {trip.sk_berlaku.map((sk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#275d1d] font-bold">•</span>
                  <span>{sk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {trip.catatan_penting && (
          <div className="p-3.5 rounded-lg bg-[#275d1d]/10 border-2 border-[#275d1d]/30 text-xs text-[#1a3814]">
            <strong className="block text-[#275d1d] mb-1 font-['Montserrat'] text-sm">Catatan Penting:</strong>
            {trip.catatan_penting}
          </div>
        )}
      </div>

      {/* Contact & Social Settings (Admin Management & Edit) */}
      <div className="bg-white border-2 border-[#275d1d] rounded-xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#275d1d]/20 pb-3">
          <div>
            <h4 className="text-xs font-extrabold text-[#275d1d] uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#275d1d]" />
              Nomor Kontak Admin (Materi Pamflet & Caption)
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Nomor WhatsApp dan Instagram berikut tercetak otomatis di baris booking pamflet dan caption promosi:
            </p>
          </div>
          <button
            onClick={() => onEdit(trip)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#275d1d] hover:bg-[#1a3814] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            title="Ubah nomor kontak WhatsApp atau akun Instagram untuk trip ini"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Nomor Kontak & Info
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Admin Jatim & Jateng */}
          <div className="p-3.5 rounded-lg bg-[#f5f5f5] border border-[#275d1d]/20">
            <span className="block text-[11px] font-bold text-[#15803D] uppercase tracking-wide">
              Admin Jatim & Jateng
            </span>
            <span className="text-sm sm:text-base font-black text-gray-900 font-['Montserrat'] mt-0.5 block">
              {trip.kontak_wa_jatim || '+6282230444428'}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 block">Tercetak di Pamflet & Caption</span>
          </div>

          {/* Admin Jakarta & Sekitarnya */}
          <div className="p-3.5 rounded-lg bg-[#f5f5f5] border border-[#275d1d]/20">
            <span className="block text-[11px] font-bold text-[#15803D] uppercase tracking-wide">
              Admin Jakarta & Sekitar
            </span>
            <span className="text-sm sm:text-base font-black text-gray-900 font-['Montserrat'] mt-0.5 block">
              {trip.kontak_wa_jakarta || '+6289503689266'}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 block">Tercetak di Pamflet & Caption</span>
          </div>

          {/* Instagram Official */}
          <div className="p-3.5 rounded-lg bg-[#f5f5f5] border border-[#275d1d]/20">
            <span className="block text-[11px] font-bold text-[#275d1d] uppercase tracking-wide">
              Akun Instagram Resmi
            </span>
            <span className="text-sm sm:text-base font-black text-gray-900 font-['Montserrat'] mt-0.5 block">
              {trip.kontak_ig || '@citoadventuremadiun'}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 block">Tercetak di Bar Booking Pamflet</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
          <span>💡 Klik tombol <strong>Edit Nomor Kontak & Info</strong> di atas jika Anda ingin mengganti nomor admin kapan saja.</span>
          <span>Diperbarui: {new Date(trip.updated_at).toLocaleDateString('id-ID')}</span>
        </div>
      </div>

      {/* Studio Pamflet & Carousel Modal */}
      <PamphletStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        trip={trip}
        onSaveTrip={onSaveTrip}
        onShowToast={onShowToast}
        initialSlide={studioInitialSlide}
      />

      {/* Caption & Broadcast Marketing Studio Modal */}
      {isCaptionStudioOpen && (
        <CaptionStudioModal
          isOpen={isCaptionStudioOpen}
          onClose={() => setIsCaptionStudioOpen(false)}
          trip={trip}
          onShowToast={onShowToast}
          initialMode={activeCaptionTab}
        />
      )}
    </div>
  );
};
