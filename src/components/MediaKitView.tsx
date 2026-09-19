import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Download,
  Calendar,
  Clock,
  MapPin,
  Mountain,
  FileText,
  Layers,
  Sparkles,
  X,
  Smartphone,
  Instagram,
  FileArchive,
  Loader2,
} from 'lucide-react';
import { Trip } from '../types';
import { formatDateRange, generateInstagramFeedCaption } from '../utils/formatters';
import {
  exportSlidePNG,
  exportAllSlidesZip,
  renderSlideCanvas,
  SlideType,
  SLIDES_LIST,
} from '../utils/canvasExport';
import { getCustomLogo, OFFICIAL_LOGO_URL } from '../utils/storage';

interface MediaKitViewProps {
  trip: Trip;
  onClosePreview?: () => void;
  isPreviewModal?: boolean;
}

export const MediaKitView: React.FC<MediaKitViewProps> = ({
  trip,
  onClosePreview,
  isPreviewModal = false,
}) => {
  const [selectedRatio, setSelectedRatio] = useState<'4:5' | '9:16'>('4:5');
  const [downloadingSlide, setDownloadingSlide] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedItinerary, setCopiedItinerary] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);

  const customLogo = getCustomLogo() || OFFICIAL_LOGO_URL;

  // Format date range
  const dateRange = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai);

  // 1. Generate Caption Promosi Utama (Gaya Caption Siap Copas Sesuai Format Baru)
  const promoCaptionText = React.useMemo(() => {
    return generateInstagramFeedCaption(trip, {
      hookStyle: 'open_trip_resmi',
      includeMepo: true,
      includeFacilities: true,
      includeExclude: true,
      includeSK: true,
      includeItinerary: false,
    });
  }, [trip]);

  // 2. Generate Teks Itinerary (Khusus & Terpisah)
  const itineraryText = React.useMemo(() => {
    const lines: string[] = [];
    const heightStr = trip.ketinggian_mdpl ? ` (${trip.ketinggian_mdpl})` : '';

    lines.push(`🗓️ ITINERARY RUNDOWN PENDAKIAN`);
    lines.push(`⛰️ ${trip.nama_gunung.toUpperCase()}${heightStr} - ${trip.jalur}`);
    lines.push(`📅 ${dateRange} (${trip.durasi})`);
    lines.push(`════════════════════════════════\n`);
    lines.push(trip.itinerary || 'Jadwal itinerary belum diatur.');
    lines.push(`\n════════════════════════════════`);
    lines.push(`*Jadwal dapat berubah menyesuaikan kondisi cuaca dan fisik rombongan tim di lapangan.`);

    return lines.join('\n');
  }, [trip, dateRange]);

  // Generate lightweight canvas previews for slides
  useEffect(() => {
    let isCancelled = false;

    const generatePreviews = async () => {
      setIsGeneratingPreviews(true);
      const newUrls: Record<string, string> = {};

      for (const slide of SLIDES_LIST.slice(0, 5)) {
        if (isCancelled) break;
        try {
          const canvas = await renderSlideCanvas(
            slide.id,
            trip,
            selectedRatio,
            trip.background_url,
            trip.background_overlay_dim ?? 0.2,
            customLogo,
            trip.slide6_photo_url
          );
          if (!isCancelled) {
            newUrls[slide.id] = canvas.toDataURL('image/jpeg', 0.82);
          }
        } catch (err) {
          console.warn(`Failed preview for slide ${slide.id}:`, err);
        }
      }

      if (!isCancelled) {
        setPreviewUrls(newUrls);
        setIsGeneratingPreviews(false);
      }
    };

    generatePreviews();

    return () => {
      isCancelled = true;
    };
  }, [trip, selectedRatio, customLogo]);

  // Copy Handlers
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(promoCaptionText);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      prompt('Salin teks caption promosi ini:', promoCaptionText);
    }
  };

  const handleCopyItinerary = async () => {
    try {
      await navigator.clipboard.writeText(itineraryText);
      setCopiedItinerary(true);
      setTimeout(() => setCopiedItinerary(false), 2500);
    } catch {
      prompt('Salin teks itinerary ini:', itineraryText);
    }
  };

  // Download single slide PNG
  const handleDownloadSlide = async (slideType: SlideType) => {
    setDownloadingSlide(slideType);
    try {
      await exportSlidePNG(
        slideType,
        trip,
        selectedRatio,
        trip.background_url,
        trip.background_overlay_dim ?? 0.2,
        customLogo,
        trip.slide6_photo_url
      );
    } catch (err) {
      console.error('Error downloading slide:', err);
      alert('Gagal mendownload slide. Silakan coba lagi.');
    } finally {
      setDownloadingSlide(null);
    }
  };

  // Download all slides ZIP
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await exportAllSlidesZip(
        trip,
        selectedRatio,
        trip.background_url,
        trip.background_overlay_dim ?? 0.2,
        customLogo,
        trip.slide6_photo_url
      );
    } catch (err) {
      console.error('Error downloading ZIP:', err);
      alert('Gagal membuat arsip ZIP. Silakan coba lagi.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 pb-20 selection:bg-[#e5a93c] selection:text-slate-900 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0f141c]/95 backdrop-blur-md border-b border-[#275d1d]/40 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src={customLogo}
                alt="Cito Adventure"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#e5a93c]/20 text-[#e5a93c] border border-[#e5a93c]/40">
                  <Sparkles className="w-3 h-3 text-[#e5a93c]" /> Media Kit Promosi
                </span>
                <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase font-['Montserrat'] leading-tight">
                  Cito Adventure Madiun
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPreviewModal && onClosePreview && (
              <button
                onClick={onClosePreview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm bg-red-600/80 hover:bg-red-600 text-white border border-red-500"
                title="Tutup Pratinjau"
              >
                <X className="w-4 h-4" />
                <span>Tutup Pratinjau</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner Trip Identity */}
      <div className="bg-gradient-to-b from-[#131b26] to-[#0a0e14] border-b border-[#275d1d]/30 px-4 sm:px-8 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#e5a93c] bg-[#e5a93c]/10 px-3 py-1 rounded-full border border-[#e5a93c]/30">
                  <Mountain className="w-3.5 h-3.5" />
                  {trip.ketinggian_mdpl || '3.000+ MDPL'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                  <MapPin className="w-3.5 h-3.5" />
                  {trip.jalur}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-['Montserrat'] leading-tight">
                {trip.nama_gunung.toUpperCase()}
              </h2>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Calendar className="w-4 h-4 text-[#e5a93c]" />
                  {dateRange}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {trip.durasi}
                </span>
              </div>
            </div>

            {/* Quick action buttons on hero */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
              <button
                onClick={handleCopyCaption}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#e5a93c] hover:bg-[#d49930] text-slate-950 shadow-lg shadow-[#e5a93c]/15 transition-all cursor-pointer active:scale-95"
              >
                {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCaption ? '✓ Caption Tersalin!' : 'Salin Caption Promosi'}</span>
              </button>

              <button
                onClick={handleCopyItinerary}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
              >
                {copiedItinerary ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-emerald-400" />}
                <span>{copiedItinerary ? '✓ Itinerary Tersalin!' : 'Salin Itinerary'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 space-y-10">

        {/* SECTION 1: DOWNLOAD PAMFLET PROMOSI HD */}
        <section className="bg-[#0f1520] border-2 border-[#275d1d]/40 rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5a93c]" />
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Montserrat'] tracking-tight">
                  Foto Pamflet Promosi HD
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Unduh pamflet resolusi tinggi satu per satu untuk WhatsApp Status, Story, atau Feed.
              </p>
            </div>

            {/* Ratio Switcher */}
            <div className="flex items-center gap-1.5 bg-[#0a0d13] p-1 rounded-xl border border-slate-800 self-start sm:self-center">
              <button
                onClick={() => setSelectedRatio('4:5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRatio === '4:5'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📸 Feed (4:5)
              </button>
              <button
                onClick={() => setSelectedRatio('9:16')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRatio === '9:16'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📱 Story / Status (9:16)
              </button>
            </div>
          </div>

          {/* Slides Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {SLIDES_LIST.slice(0, 5).map((slide, index) => {
              const preview = previewUrls[slide.id];
              const isDownloading = downloadingSlide === slide.id;

              return (
                <div
                  key={slide.id}
                  className="group bg-[#141a24] border border-slate-800/80 hover:border-[#e5a93c]/50 rounded-xl overflow-hidden flex flex-col transition-all duration-200 shadow-md hover:shadow-xl"
                >
                  {/* Visual Preview Box */}
                  <div className="relative aspect-[4/5] bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/80">
                    {preview ? (
                      <img
                        src={preview}
                        alt={slide.title}
                        className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Loader2 className="w-6 h-6 text-[#e5a93c] animate-spin" />
                        <span className="text-[11px] text-slate-500 font-medium">Membuat preview...</span>
                      </div>
                    )}

                    {/* Slide Number Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-extrabold text-[#e5a93c] border border-slate-700/60 shadow-xs">
                      Slide {index + 1} / 5
                    </div>
                  </div>

                  {/* Info & Download Button */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {slide.title.replace(/^Slide \d+: /, '')}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {slide.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadSlide(slide.id)}
                      disabled={isDownloading}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold bg-[#275d1d] hover:bg-[#1f4a17] text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengunduh...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Slide {index + 1} (PNG)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download All ZIP Banner */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#e5a93c]/15 border border-[#e5a93c]/30 flex items-center justify-center shrink-0">
                <FileArchive className="w-5 h-5 text-[#e5a93c]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Unduh Semua Slide Sekaligus
                </h4>
                <p className="text-[11px] text-slate-400">
                  Kemasan format .ZIP berisi seluruh slide 1 sampai 5 kualitas HD ({selectedRatio}).
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#e5a93c] hover:bg-[#d49930] text-slate-950 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-md active:scale-95"
            >
              {isDownloadingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengompres File...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Semua (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECTION 2: CAPTION MATERI PROMOSI (GAYA CAPTION SIAP COPAS) */}
        <section className="bg-[#0f1520] border-2 border-slate-800 hover:border-[#e5a93c]/40 transition-colors rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Montserrat'] tracking-tight">
                  Teks Caption Promosi (Siap Copas)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Tersusun rapi dengan nama gunung, mepo & harga, include, exclude, serta S&K.
              </p>
            </div>

            <button
              onClick={handleCopyCaption}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-md ${
                copiedCaption
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#e5a93c] hover:bg-[#d49930] text-slate-950 active:scale-95'
              }`}
            >
              {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCaption ? '✓ Caption Berhasil Disalin!' : 'Salin Caption Promosi'}</span>
            </button>
          </div>

          {/* Caption Terminal / Box */}
          <div className="mt-5 relative">
            <div className="bg-[#070a0f] border border-slate-800 rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto selection:bg-[#275d1d] selection:text-white">
              {promoCaptionText}
            </div>

            {/* Floating Copy Button on mobile */}
            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={handleCopyCaption}
                className="text-xs font-bold text-[#e5a93c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin teks di atas</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: ITINERARY RUNDOWN (TOMBOL COPAS TERPISAH) */}
        <section className="bg-[#0f1520] border-2 border-slate-800 hover:border-emerald-500/40 transition-colors rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Montserrat'] tracking-tight">
                  Itinerary Rundown Perjalanan
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Jadwal jam demi jam kegiatan pendakian (khusus untuk info rundown saat peserta chat).
              </p>
            </div>

            <button
              onClick={handleCopyItinerary}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-md ${
                copiedItinerary
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white active:scale-95'
              }`}
            >
              {copiedItinerary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedItinerary ? '✓ Itinerary Berhasil Disalin!' : 'Salin Itinerary Khusus'}</span>
            </button>
          </div>

          {/* Itinerary Box */}
          <div className="mt-5 relative">
            <div className="bg-[#070a0f] border border-slate-800 rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto selection:bg-[#275d1d] selection:text-white">
              {itineraryText}
            </div>

            {/* Floating Copy Button on mobile */}
            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={handleCopyItinerary}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin rundown itinerary di atas</span>
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Branding */}
      <footer className="mt-16 text-center text-xs text-slate-500 py-6 border-t border-slate-800/80">
        <p>© 2026 Cito Adventure Madiun • Media Kit Resmi Tim & Mitra</p>
      </footer>
    </div>
  );
};
