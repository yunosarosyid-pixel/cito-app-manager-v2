import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <AnimatePresence mode="wait">
      <motion.div
        key={trip.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="space-y-4"
      >
        {/* Top Banner & Heading */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            {/* Badges Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {trip.is_draft ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  DRAFT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  FINAL
                </span>
              )}

              {trip.from_team ? (
                <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Tim {trip.draf_oleh ? `(${trip.draf_oleh})` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  Admin Mas Yuno
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                  isBuka
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isBuka ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                Kuota: {trip.status}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                <MapPin className="w-3 h-3 text-slate-500" />
                {trip.jalur}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-['Montserrat'] tracking-tight text-slate-900">
              {trip.nama_gunung.toUpperCase()} {trip.ketinggian_mdpl ? trip.ketinggian_mdpl.toUpperCase() : ''}
            </h2>
            <p className="text-xs font-semibold text-slate-500 font-['Montserrat'] tracking-wide uppercase">
              Jalur: {trip.jalur}
            </p>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-1.5 self-start flex-wrap shrink-0">
            {trip.is_draft ? (
              <button
                onClick={() => {
                  const approved = {
                    ...trip,
                    is_draft: false,
                    from_team: trip.from_team === true,
                    updated_at: Date.now(),
                  };
                  onSaveTrip?.(approved);
                  const authorLabel = trip.from_team ? 'Draf Tim' : 'Draf Admin';
                  onShowToast(`${authorLabel} ${trip.nama_gunung} resmi diterbitkan ke FINAL (Siap Promosi)!`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e4916] hover:bg-[#15340f] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                title="Klik untuk mengubah status trip menjadi Final"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Terbitkan Final</span>
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
                  onSaveTrip?.(toDraft);
                  onShowToast(`Trip ${trip.nama_gunung} dikembalikan ke DRAFT.`);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Kembalikan status trip ke Draf"
              >
                <span>Ubah ke Draft</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            <button
              onClick={() => {
                if (onOpenMediaKit) {
                  onOpenMediaKit(trip);
                } else {
                  window.open(getTripMediaKitUrl(trip), '_blank');
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-slate-100 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Pratinjau Media Kit Publik"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Media Kit</span>
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Salin Link Media Kit untuk dikirimkan ke WhatsApp tim"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Salin Link</span>
            </button>

            <button
              onClick={() => onEdit(trip)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => onDelete(trip)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Hapus trip ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* Draft Notice Banner */}
        {trip.is_draft && (
          <div className="mt-3 p-3 bg-amber-50/90 border border-amber-300 rounded-lg flex items-center justify-between gap-3 flex-wrap">
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
              className="px-2.5 py-1 bg-[#1e4916] hover:bg-[#15340f] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              ✓ Setujui Sekarang
            </button>
          </div>
        )}

        {/* Quick Meta Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3.5 border-t border-slate-100">
          <div className={`bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200 ${trip.jadwal_tambahan && trip.jadwal_tambahan.length > 0 ? 'sm:col-span-2' : ''}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Jadwal Keberangkatan
            </span>

            {trip.jadwal_tambahan && trip.jadwal_tambahan.length > 0 ? (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                  <span className="text-[#1e4916] font-bold">•</span>
                  <span>{dateRange}</span>
                </div>
                {trip.jadwal_tambahan.map((sch, i) => (
                  <div key={sch.id || i} className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                    <span className="text-[#1e4916] font-bold">•</span>
                    <span>{formatDateRange(sch.tanggal_mulai, sch.tanggal_selesai)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm sm:text-base font-bold text-slate-900 font-['Montserrat'] mt-1">
                {dateRange}
              </p>
            )}
          </div>

          {(!trip.jadwal_tambahan || trip.jadwal_tambahan.length === 0) && (
            <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Durasi
              </span>
              <p className="text-sm sm:text-base font-bold text-[#1e4916] font-['Montserrat'] mt-1">
                {trip.durasi}
              </p>
            </div>
          )}

          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" /> Kuota Peserta
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-900 font-['Montserrat'] mt-1">
              {trip.min_peserta || '7'} - {trip.max_peserta || '20'} Pax
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Min Madiun: {trip.min_peserta || '7'} | Min Jakarta: {trip.min_peserta_jakarta || trip.min_peserta || '7'}
            </p>
          </div>
        </div>
      </div>

      {/* Export Action Bar (PNG 4:5 & 9:16, PDF, TXT) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-['Montserrat'] flex items-center gap-2">
              <Download className="w-4 h-4 text-[#1e4916]" />
              Pusat Export Media & Arsip Trip
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ekspor instan pamflet visual resolusi tinggi, poster itinerary, dan berkas arsip resmi.
            </p>
          </div>

          <button
            onClick={() => {
              setStudioInitialSlide('cover');
              setIsStudioOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1e4916] hover:bg-[#15340f] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Studio Desain Pamflet</span>
          </button>
        </div>

        {/* Structured Row Items (No nested cards, clean dividers) */}
        <div className="divide-y divide-slate-100 text-xs">
          {/* Row 1: Pamflet Cover & Slide Utama */}
          <div className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1e4916] border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <Image className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 font-['Montserrat'] text-xs sm:text-sm">
                    Pamflet Cover & Slide Utama
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Logo resmi Cito, judul gunung, harga start meeting point, & booking bar.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={() => handleExportPamphlet('4:5')}
                  disabled={isExporting !== null}
                  className="px-2.5 py-1 text-xs font-semibold rounded text-slate-700 hover:text-slate-900 hover:bg-white transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh pamflet format Feed Instagram (4:5)"
                >
                  4:5 Feed
                </button>
                <button
                  onClick={() => handleExportPamphlet('9:16')}
                  disabled={isExporting !== null}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1e4916] text-white hover:bg-[#15340f] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Unduh pamflet format Story / Status (9:16)"
                >
                  9:16 Story
                </button>
              </div>

              <button
                onClick={() => {
                  setStudioInitialSlide('cover');
                  setIsStudioOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                title="Sesuaikan foto latar atau tata letak di Studio Pamflet"
              >
                <Sliders className="w-3 h-3 text-slate-500" />
                <span className="hidden md:inline">Kustomisasi</span>
              </button>
            </div>
          </div>

          {/* Row 2: Poster Rundown Itinerary */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1e4916] border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 font-['Montserrat'] text-xs sm:text-sm">
                    Poster Rundown Itinerary
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Timeline rundown harian, kartu transparan, jam aktivitas pendakian, & kontak.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={() => handleExportItineraryPoster('4:5')}
                  disabled={isExporting !== null}
                  className="px-2.5 py-1 text-xs font-semibold rounded text-slate-700 hover:text-slate-900 hover:bg-white transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh poster rundown format Feed (4:5)"
                >
                  4:5 Feed
                </button>
                <button
                  onClick={() => handleExportItineraryPoster('9:16')}
                  disabled={isExporting !== null}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1e4916] text-white hover:bg-[#15340f] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Unduh poster rundown format Story (9:16)"
                >
                  9:16 Story
                </button>
              </div>

              <button
                onClick={() => {
                  setStudioInitialSlide('itinerary');
                  setIsStudioOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                title="Buka slide itinerary di Studio Pamflet"
              >
                <Layers className="w-3 h-3 text-slate-500" />
                <span className="hidden md:inline">Kustomisasi</span>
              </button>
            </div>
          </div>

          {/* Row 3: Dokumen Arsip PDF & TXT */}
          <div className="py-3 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 font-['Montserrat'] text-xs sm:text-sm">
                    Dokumen Arsip Cetak & Catatan
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Berkas operasional lengkap dalam dokumen PDF resmi dan salinan teks (.TXT).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3 text-slate-600" />
                <span>Unduh PDF</span>
              </button>
              <button
                onClick={handleExportTXT}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Unduh TXT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Caption & Broadcast Marketing Generator Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 font-['Montserrat'] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#1e4916]" />
              Generator Caption & Broadcast Promosi
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Salin teks promosi instan untuk Feed Instagram, pesan siaran WhatsApp grup, atau Story singkat.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCaptionStudioOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Studio Caption</span>
            </button>

            <button
              onClick={handleCopyCaption}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e4916] hover:bg-[#15340f] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              {copiedCaption ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
              <span>{copiedCaption ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Buka WhatsApp langsung dengan teks ini"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white" />
              <span>Kirim ke WA</span>
            </button>
          </div>
        </div>

        {/* Segmented Tab Switch */}
        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200/80 gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveCaptionTab('instagram')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCaptionTab === 'instagram'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Instagram className="w-3.5 h-3.5 text-rose-600" />
            <span>Feed & Reels</span>
          </button>

          <button
            onClick={() => setActiveCaptionTab('whatsapp')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCaptionTab === 'whatsapp'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Broadcast WA Grup</span>
          </button>

          <button
            onClick={() => setActiveCaptionTab('story')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCaptionTab === 'story'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Story Singkat</span>
          </button>
        </div>

        {/* Text Preview Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 relative font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all max-h-60 overflow-y-auto">
          {previewCaptionText}
        </div>
      </div>

      {/* Meeting Point & Pricing */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Montserrat']">
          Tarif per Meeting Point (MEPO)
        </h3>
        {trip.harga_mepo && trip.harga_mepo.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {trip.harga_mepo.map((m, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">{m.lokasi || 'Meeting Point'}</span>
                <span className="text-xs sm:text-sm font-bold text-[#1e4916] font-['Montserrat']">
                  {m.harga || '-'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Belum ada data tarif meeting point.</p>
        )}
      </div>

      {/* Include & Exclude Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Include */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Fasilitas Include
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {(trip.include || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Exclude */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            Exclude (Tidak Termasuk)
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {(trip.exclude || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-600 font-bold mt-0.5">✕</span>
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
          {trip.extra_porter && (
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 font-semibold">
              🎒 Extra Porter: {trip.extra_porter}
            </div>
          )}
        </div>
      </div>

      {/* Itinerary Preview & Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#1e4916]" />
            Rundown & Itinerary Kegiatan
          </h3>
          <button
            onClick={() => onOpenItinerary(trip)}
            className="text-xs font-semibold text-[#1e4916] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Editor Itinerary</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#1e4916]" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
          {trip.itinerary || 'Belum ada rundown itinerary.'}
        </div>
      </div>

      {/* S&K & Catatan Penting */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {trip.sk_berlaku && trip.sk_berlaku.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase font-['Montserrat']">
              Syarat & Ketentuan (S&K):
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {trip.sk_berlaku.map((sk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{sk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {trip.catatan_penting && (
          <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
            <strong className="block text-amber-950 mb-1 font-['Montserrat'] text-xs font-bold uppercase tracking-wider">Catatan Penting:</strong>
            {trip.catatan_penting}
          </div>
        )}
      </div>

      {/* Contact & Social Settings (Admin Management & Edit) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Montserrat'] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#1e4916]" />
              Nomor Kontak Admin (Materi Pamflet & Caption)
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Nomor WhatsApp dan Instagram berikut tercetak otomatis di baris booking pamflet dan caption promosi:
            </p>
          </div>
          <button
            onClick={() => onEdit(trip)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e4916] hover:bg-[#15340f] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            title="Ubah nomor kontak WhatsApp atau akun Instagram untuk trip ini"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Nomor Kontak
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Admin Jatim & Jateng */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Admin Jatim & Jateng
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {trip.kontak_wa_jatim || '+6282230444428'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Tercetak di Pamflet & Caption</span>
          </div>

          {/* Admin Jakarta & Sekitarnya */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Admin Jakarta & Sekitar
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {trip.kontak_wa_jakarta || '+6289503689266'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Tercetak di Pamflet & Caption</span>
          </div>

          {/* Instagram Official */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Akun Instagram Resmi
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {trip.kontak_ig || '@citoadventuremadiun'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Tercetak di Bar Booking Pamflet</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
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
      </motion.div>
    </AnimatePresence>
  );
};
