import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trip } from '../types';
import {
  SLIDES_LIST,
  SlideType,
  renderSlideCanvas,
  exportSlidePNG,
  exportAllSlidesZip,
  PRESET_BACKGROUNDS,
} from '../utils/canvasExport';
import { getCustomLogo, setCustomLogo, clearCustomLogo, OFFICIAL_LOGO_URL } from '../utils/storage';
import { optimizeLogoImage, optimizeBackgroundImage } from '../utils/imageOptimizer';
import { CaptionStudioModal } from './CaptionStudioModal';
import {
  X,
  Download,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Sliders,
  Camera,
  Share2,
} from 'lucide-react';

interface PamphletStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onSaveTrip?: (updatedTrip: Trip) => void;
  onShowToast: (msg: string) => void;
  initialSlide?: SlideType;
}

export const PamphletStudioModal: React.FC<PamphletStudioModalProps> = ({
  isOpen,
  onClose,
  trip,
  onSaveTrip,
  onShowToast,
  initialSlide = 'cover',
}) => {
  const [activeSlide, setActiveSlide] = useState<SlideType>(initialSlide);
  const [ratio, setRatio] = useState<'4:5' | '9:16'>('9:16');
  const [bgUrl, setBgUrl] = useState<string>(trip.background_url || '/default-bg.jpg');
  const [dimRatio, setDimRatio] = useState<number>(trip.background_overlay_dim ?? 0.2);
  const [slide6PhotoUrl, setSlide6PhotoUrl] = useState<string>(trip.slide6_photo_url || '');
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [hasSavedBg, setHasSavedBg] = useState(false);
  const [activeLogo, setActiveLogo] = useState<string>(trip.logo_url || getCustomLogo() || OFFICIAL_LOGO_URL);
  const [isCustomLogoActive, setIsCustomLogoActive] = useState<boolean>(Boolean(trip.logo_url || getCustomLogo()));
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const slide6FileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when trip or initialSlide changes
  useEffect(() => {
    if (isOpen) {
      setActiveSlide(initialSlide);
      setBgUrl(trip.background_url || '/default-bg.jpg');
      setDimRatio(trip.background_overlay_dim ?? 0.2);
      setSlide6PhotoUrl(trip.slide6_photo_url || '');
      setActiveLogo(trip.logo_url || getCustomLogo() || OFFICIAL_LOGO_URL);
      setIsCustomLogoActive(Boolean(trip.logo_url || getCustomLogo()));
      setHasSavedBg(false);
    }
  }, [isOpen, trip, initialSlide]);

  // Listen for global logo updates
  useEffect(() => {
    const handleGlobalLogoUpdate = () => {
      const current = trip.logo_url || getCustomLogo() || OFFICIAL_LOGO_URL;
      setActiveLogo(current);
      setIsCustomLogoActive(Boolean(trip.logo_url || getCustomLogo()));
    };
    window.addEventListener('cito_logo_updated', handleGlobalLogoUpdate);
    return () => window.removeEventListener('cito_logo_updated', handleGlobalLogoUpdate);
  }, [trip.logo_url]);

  // Render canvas preview whenever activeSlide, ratio, bgUrl, dimRatio, activeLogo, or slide6PhotoUrl changes
  const updatePreview = useCallback(async () => {
    setIsRendering(true);
    try {
      const canvas = await renderSlideCanvas(
        activeSlide,
        trip,
        ratio,
        bgUrl,
        dimRatio,
        activeLogo,
        slide6PhotoUrl
      );
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to render canvas preview', err);
    } finally {
      setIsRendering(false);
    }
  }, [activeSlide, trip, ratio, bgUrl, dimRatio, activeLogo, slide6PhotoUrl]);

  useEffect(() => {
    if (isOpen) {
      updatePreview();
    }
  }, [isOpen, updatePreview]);

  if (!isOpen) return null;

  // Handle custom image upload from computer/device
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Pilih file gambar valid (JPG, PNG, WebP)');
      return;
    }

    try {
      const optimized = await optimizeBackgroundImage(file);
      setBgUrl(optimized);
      setHasSavedBg(true);
      if (onSaveTrip) {
        onSaveTrip({
          ...trip,
          background_url: optimized,
          background_overlay_dim: dimRatio,
          slide6_photo_url: slide6PhotoUrl || undefined,
          updated_at: Date.now(),
        });
      }
      onShowToast('✓ Foto background dimuat & tersimpan otomatis ke Cloud!');
    } catch (err) {
      console.error('Failed to optimize background image', err);
      onShowToast('Gagal memproses foto background');
    } finally {
      e.target.value = '';
    }
  };

  // Handle custom photo upload specifically for Slide 6
  const handleSlide6Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Pilih file gambar valid (JPG, PNG, WebP)');
      return;
    }

    try {
      const optimized = await optimizeBackgroundImage(file);
      setSlide6PhotoUrl(optimized);
      setHasSavedBg(true);
      if (onSaveTrip) {
        onSaveTrip({
          ...trip,
          background_url: bgUrl || '/default-bg.jpg',
          background_overlay_dim: dimRatio,
          slide6_photo_url: optimized,
          updated_at: Date.now(),
        });
      }
      onShowToast('✓ Foto khusus Slide 6 dimuat & tersimpan otomatis ke Cloud!');
    } catch (err) {
      console.error('Failed to optimize slide 6 image', err);
      onShowToast('Gagal memproses foto Slide 6');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetSlide6Photo = () => {
    setSlide6PhotoUrl('');
    setHasSavedBg(true);
    if (onSaveTrip) {
      onSaveTrip({
        ...trip,
        background_url: bgUrl || '/default-bg.jpg',
        background_overlay_dim: dimRatio,
        slide6_photo_url: undefined,
        updated_at: Date.now(),
      });
    }
    onShowToast('Foto Slide 6 direset (menggunakan foto background utama)');
  };

  // Reset to default Sindoro mountain photo
  const handleResetBackground = () => {
    setBgUrl('/default-bg.jpg');
    setDimRatio(0.2);
    setHasSavedBg(true);
    if (onSaveTrip) {
      onSaveTrip({
        ...trip,
        background_url: '/default-bg.jpg',
        background_overlay_dim: 0.2,
        slide6_photo_url: slide6PhotoUrl || undefined,
        updated_at: Date.now(),
      });
    }
    onShowToast('Background direset ke Gunung Sindoro bawaan');
  };

  // Logo upload & reset
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Pilih file gambar logo valid (PNG, JPG, WebP)');
      return;
    }

    try {
      const optimized = await optimizeLogoImage(file);
      setCustomLogo(optimized);
      setActiveLogo(optimized);
      setIsCustomLogoActive(true);
      onShowToast('Logo baru berhasil dimuat & diterapkan ke semua pamflet!');
      updatePreview();
    } catch (err) {
      console.error('Failed to optimize logo', err);
      onShowToast('Gagal memproses gambar logo');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetLogo = () => {
    clearCustomLogo();
    setActiveLogo(OFFICIAL_LOGO_URL);
    setIsCustomLogoActive(false);
    onShowToast('Logo direset ke logo bawaan');
    updatePreview();
  };

  // Save current background & dimming & slide 6 photo to the Trip
  const handleSaveBackgroundToTrip = () => {
    if (onSaveTrip) {
      const updated: Trip = {
        ...trip,
        background_url: bgUrl || '/default-bg.jpg',
        background_overlay_dim: dimRatio,
        slide6_photo_url: slide6PhotoUrl || undefined,
        updated_at: Date.now(),
      };
      onSaveTrip(updated);
      setHasSavedBg(true);
      onShowToast('Pengaturan background & Slide 6 tersimpan di Trip ini!');
    }
  };

  // Download currently active slide
  const handleDownloadActiveSlide = async () => {
    setIsExporting('single');
    onShowToast(`Menyiapkan slide ${activeSlide} (${ratio})...`);
    try {
      await exportSlidePNG(
        activeSlide,
        trip,
        ratio,
        bgUrl,
        dimRatio,
        activeLogo,
        slide6PhotoUrl
      );
      onShowToast(`Slide ${activeSlide} (${ratio}) berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal mengunduh slide');
    } finally {
      setIsExporting(null);
    }
  };

  // Download all 6 slides in a ZIP archive
  const handleDownloadAllZip = async () => {
    setIsExporting('zip');
    onShowToast(`Memproses 6 slide carousel (${ratio}) ke ZIP...`);
    try {
      await exportAllSlidesZip(
        trip,
        ratio,
        bgUrl,
        dimRatio,
        activeLogo,
        slide6PhotoUrl
      );
      onShowToast(`Semua 6 slide (${ratio}) berhasil diunduh dalam ZIP!`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal membuat arsip ZIP carousel');
    } finally {
      setIsExporting(null);
    }
  };

  const activeSlideIndex = SLIDES_LIST.findIndex((s) => s.id === activeSlide);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#f8fafc] border border-slate-200 w-full max-w-5xl rounded-2xl shadow-xl flex flex-col max-h-[96vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="bg-[#0f172a] text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 bg-white/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold font-['Space_Grotesk'] truncate">
                Studio Pamflet & Carousel Trip
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                🏔️ {trip.nama_gunung.toUpperCase()} {trip.ketinggian_mdpl || ''} · 📌 {trip.jalur.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Ratio Selector & Close Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 p-0.5 rounded-lg flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setRatio('9:16')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  ratio === '9:16'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                9:16 Story
              </button>
              <button
                type="button"
                onClick={() => setRatio('4:5')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  ratio === '4:5'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                4:5 Feed
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Tabs Navigation */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {SLIDES_LIST.map((slide, idx) => {
            const isActive = activeSlide === slide.id;
            return (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(slide.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#1e4916] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-white text-[#1e4916]' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{slide.title.replace(/^Slide \d+: /, '')}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content: Split Preview and Controls */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Live Visual Canvas Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#dcdcdc] rounded-xl p-3 sm:p-4 border border-[#275d1d]/30 relative min-h-[380px]">
            {/* Quick Next/Prev Controls */}
            <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-[#275d1d] font-bold">
              <button
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlide(SLIDES_LIST[activeSlideIndex - 1].id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer border border-[#275d1d]/30"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Slide Sebelumnya
              </button>

              <span className="text-[11px] font-extrabold font-['Space_Grotesk']">
                {activeSlideIndex + 1} / {SLIDES_LIST.length} ({ratio})
              </span>

              <button
                disabled={activeSlideIndex === SLIDES_LIST.length - 1}
                onClick={() => setActiveSlide(SLIDES_LIST[activeSlideIndex + 1].id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer border border-[#275d1d]/30"
              >
                Slide Berikutnya <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Canvas Preview Box */}
            <div
              className={`w-full relative flex items-center justify-center overflow-hidden rounded-lg shadow-xl border-2 border-[#275d1d] ${
                bgUrl === 'transparent' ? 'bg-[#222]' : 'bg-[#111827]'
              } ${ratio === '9:16' ? 'max-w-[290px] aspect-[9/16]' : 'max-w-[340px] aspect-[4/5]'}`}
              style={
                bgUrl === 'transparent'
                  ? {
                      backgroundImage:
                        'linear-gradient(45deg, #2d3748 25%, transparent 25%), linear-gradient(-45deg, #2d3748 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2d3748 75%), linear-gradient(-45deg, transparent 75%, #2d3748 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    }
                  : undefined
              }
            >
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt={`Preview ${activeSlide}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-white text-xs flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Merender grafis...</span>
                </div>
              )}

              {isRendering && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Memperbarui preview...</span>
                </div>
              )}

              {bgUrl === 'transparent' && (
                <div className="absolute top-2 right-2 bg-amber-400 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow">
                  ✨ Mode Transparan
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#275d1d] font-semibold mt-3 text-center">
              💡 Gambar di-render resolusi tinggi (1080px) saat diunduh.
            </p>
          </div>

          {/* Right Column: Customization Controls & Download Actions */}
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Box Khusus: Upload Foto Slide 6 (Random Foto) */}
              {activeSlide === 'random_photo' && (
                <div className="bg-amber-50/80 border-2 border-amber-400 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-300 pb-2">
                    <h3 className="text-xs sm:text-sm font-extrabold font-['Space_Grotesk'] text-[#275d1d] flex items-center gap-2">
                      <Camera className="w-4 h-4 text-amber-600" />
                      Foto Khusus Slide 6 (Random Foto)
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      {slide6PhotoUrl ? 'Foto Kustom Terpasang' : 'Foto Default/Background'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-900 border border-amber-300 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                      <img
                        src={slide6PhotoUrl || bgUrl || trip.background_url || '/default-bg.jpg'}
                        alt="Preview Slide 6"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={slide6FileInputRef}
                        onChange={handleSlide6Upload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => slide6FileInputRef.current?.click()}
                          className="flex-1 py-1.5 px-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah Foto Slide 6</span>
                        </button>

                        {Boolean(slide6PhotoUrl) && (
                          <button
                            type="button"
                            onClick={handleResetSlide6Photo}
                            className="py-1.5 px-2.5 bg-white hover:bg-gray-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Reset ke background trip utama"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10.5px] text-amber-900 leading-tight">
                        Pilih foto pemandangan, dokumentasi jalur, atau potret alam dari perangkat Anda. Slide 6 hanya menampilkan foto ini dan watermark booking Cito di bawah.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Box 1: Sistem Edit Background */}
              <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#275d1d]/20 pb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold font-['Space_Grotesk'] text-[#275d1d] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#275d1d]" />
                    Pilihan Latar Belakang (Background)
                  </h3>
                  {hasSavedBg && (
                    <span className="text-[10px] font-bold text-[#275d1d] bg-[#d1d1d1] px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#275d1d]" /> Tersimpan di Trip
                    </span>
                  )}
                </div>

                {/* Preset Background Selector Chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    Preset & Mode Background:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {PRESET_BACKGROUNDS.map((preset) => {
                      const isSelected = bgUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setBgUrl(preset.url);
                            setHasSavedBg(false);
                            onShowToast(`Latar diubah ke: ${preset.name}`);
                          }}
                          className={`p-2 rounded-lg text-left text-xs font-bold border transition-all flex flex-col gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#275d1d] text-white border-[#275d1d] shadow-xs'
                              : 'bg-[#f7f7f7] text-gray-800 border-gray-200 hover:bg-gray-100'
                          }`}
                          title={preset.description}
                        >
                          <span className="text-sm">{preset.icon}</span>
                          <span className="truncate leading-tight">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {bgUrl === 'transparent' && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                      ✨ <strong>Mode Transparan Aktif:</strong> Hasil export PNG tembus pandang tanpa background. Sangat cocok ditempel (*overlay*) di Canva, Photoshop, atau video reels/TikTok!
                    </p>
                  )}
                </div>

                {/* Upload Button & Reset */}
                <div className="space-y-2 pt-2 border-t border-[#275d1d]/15">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-[#275d1d] hover:bg-[#1f4a17] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-white" />
                      <span>Unggah Foto Sendiri</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetBackground}
                      className="py-2 px-3 bg-[#e5e5e5] hover:bg-[#d8d8d8] text-[#275d1d] border border-[#275d1d]/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Reset ke Foto Sindoro Asli"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Dimming Overlay Slider */}
                {bgUrl !== 'transparent' ? (
                  <div className="space-y-1.5 pt-2 border-t border-[#275d1d]/15">
                    <div className="flex items-center justify-between text-xs font-bold text-[#275d1d]">
                      <label htmlFor="dim-slider" className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        Kegelapan Background (Kontras Teks)
                      </label>
                      <span className="bg-[#275d1d] text-white px-2 py-0.5 rounded text-[11px] font-mono">
                        {Math.round(dimRatio * 100)}%
                      </span>
                    </div>
                    <input
                      id="dim-slider"
                      type="range"
                      min="0"
                      max="0.75"
                      step="0.05"
                      value={dimRatio}
                      onChange={(e) => {
                        setDimRatio(parseFloat(e.target.value));
                        setHasSavedBg(false);
                      }}
                      className="w-full accent-[#275d1d] cursor-pointer"
                    />
                    <p className="text-[10.5px] text-gray-600">
                      Geser ke kanan untuk menggelapkan background jika foto Anda terlalu terang, agar teks putih tetap tajam terbaca.
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#275d1d]/15 text-[11px] text-gray-500 italic">
                    💡 Efek kegelapan otomatis nonaktif pada mode transparan.
                  </div>
                )}

                {/* Save to trip button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveBackgroundToTrip}
                    className="w-full py-1.5 px-3 bg-white hover:bg-[#f3f4f6] text-[#275d1d] border-2 border-[#275d1d] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-[#275d1d]" />
                    <span>Simpan Pilihan Background ke Trip Ini</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Ganti & Atur Logo Pamflet */}
              <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#275d1d]/20 pb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold font-['Space_Grotesk'] text-[#275d1d] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#275d1d]" />
                    Logo Pamflet & Branding
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      isCustomLogoActive
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isCustomLogoActive ? 'Logo Kustom Aktif' : 'Logo Bawaan'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-900 border border-[#275d1d]/30 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                    <img
                      src={activeLogo}
                      alt="Logo Cito Adventure"
                      className="w-full h-full object-contain drop-shadow"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2.5 bg-[#275d1d] hover:bg-[#1f4a17] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-white" />
                        <span>Unggah Logo Asli (.PNG)</span>
                      </button>

                      {isCustomLogoActive && (
                        <button
                          type="button"
                          onClick={handleResetLogo}
                          className="py-1.5 px-2.5 bg-[#e5e5e5] hover:bg-[#d8d8d8] text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Kembalikan ke logo bawaan"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10.5px] text-gray-600 leading-tight">
                      Ganti logo dengan file logo asli Cito Adventure dari perangkat Anda. Logo otomatis terpasang pada Slide 1 & Slide 5.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 3: Detail Slide Info */}
              <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-sm space-y-2">
                <h4 className="text-xs font-extrabold font-['Space_Grotesk'] text-[#275d1d] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#275d1d]" />
                  {SLIDES_LIST[activeSlideIndex].title}
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {SLIDES_LIST[activeSlideIndex].subtitle}
                </p>

                {activeSlide === 'itinerary' && (
                  <div className="bg-[#f5f5f5] p-2.5 rounded-lg border border-[#275d1d]/20 text-[11px] text-gray-800">
                    💡 <strong>Itinerary:</strong> Disusun otomatis dalam format hari (H-1, Hari 1, Hari 2) dan jam pelaksanaan sesuai data rundown trip.
                  </div>
                )}

                {activeSlide === 'facilities' && (
                  <div className="bg-[#f5f5f5] p-2.5 rounded-lg border border-[#275d1d]/20 text-[11px] text-gray-800">
                    💡 <strong>Fasilitas:</strong> Dua kolom rapi (Include dengan ikon kendaraan, tenda, HT & Exclude dengan tanda larangan).
                  </div>
                )}

                {activeSlide === 'contact' && (
                  <div className="bg-[#f5f5f5] p-2.5 rounded-lg border border-[#275d1d]/20 text-[11px] text-gray-800">
                    💡 <strong>Info Lebih Lanjut:</strong> Grid 2x2 kontak WhatsApp Admin Jatim & Jakarta, Instagram, dan Live Streaming TikTok serta ajakan cek caption.
                  </div>
                )}

                {activeSlide === 'random_photo' && (
                  <div className="bg-[#f5f5f5] p-2.5 rounded-lg border border-[#275d1d]/20 text-[11px] text-gray-800">
                    💡 <strong>Random Foto:</strong> Menampilkan foto dokumentasi jalur atau panorama bebas secara penuh, hanya dilengkapi watermark booking bar di bagian bawah.
                  </div>
                )}
              </div>
            </div>

            {/* Box 3: Export Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 mt-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 font-['Space_Grotesk']">
                <span>PILIHAN UNDUH GAMBAR</span>
                <span className="text-[10px] bg-slate-900 text-emerald-400 font-mono px-2 py-0.5 rounded">
                  Format PNG 1080p
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Download Single Slide */}
                <button
                  type="button"
                  onClick={handleDownloadActiveSlide}
                  disabled={isExporting !== null}
                  className="py-2.5 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#1e4916]" />
                  <span>
                    {isExporting === 'single'
                      ? 'Sedang Mengunduh...'
                      : `Unduh Slide Ini (${ratio})`}
                  </span>
                </button>

                {/* Download All 6 Slides in ZIP */}
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isExporting !== null}
                  className="py-2.5 px-3.5 bg-[#1e4916] hover:bg-[#15340f] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>
                    {isExporting === 'zip'
                      ? 'Memproses ZIP...'
                      : `Unduh 6 Slide Carousel (ZIP)`}
                  </span>
                </button>
              </div>

              {/* Quick Jump to Caption Studio */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-[11px] text-slate-600">
                  Perlu teks promosi untuk postingan pamflet ini?
                </div>
                <button
                  type="button"
                  onClick={() => setIsCaptionModalOpen(true)}
                  className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#1e4916]" />
                  <span>Buka Generator Caption & WA</span>
                </button>
              </div>

              <p className="text-[10.5px] text-slate-500 text-center">
                Pilih <strong>9:16</strong> untuk Story Instagram & Status WhatsApp, atau <strong>4:5</strong> untuk Postingan Feed Carousel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Caption Studio Modal */}
      {isCaptionModalOpen && (
        <CaptionStudioModal
          isOpen={isCaptionModalOpen}
          onClose={() => setIsCaptionModalOpen(false)}
          trip={trip}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
