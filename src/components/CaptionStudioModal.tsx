import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Instagram,
  Zap,
  Sliders,
  RefreshCw,
  Edit3,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Trip } from '../types';
import {
  generateInstagramFeedCaption,
  generateWhatsAppBroadcastCaption,
  generateStoryQuickCaption,
  HOOK_OPTIONS,
  HookStyle,
  CaptionCustomOptions,
} from '../utils/formatters';

interface CaptionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onShowToast: (msg: string) => void;
  initialMode?: 'instagram' | 'whatsapp' | 'story';
}

const STORAGE_KEY_HOOK_STYLE = 'cito_caption_hook_style_v2';
const STORAGE_KEY_HOOK_TITLE = 'cito_caption_hook_title_v2';
const STORAGE_KEY_HOOK_INTRO = 'cito_caption_hook_intro_v2';
const STORAGE_KEY_WA_GREETING = 'cito_caption_wa_greeting_v2';
const STORAGE_KEY_WA_INTRO = 'cito_caption_wa_intro_v2';

export const CaptionStudioModal: React.FC<CaptionStudioModalProps> = ({
  isOpen,
  onClose,
  trip,
  onShowToast,
  initialMode = 'instagram',
}) => {
  const [activeTab, setActiveTab] = useState<'instagram' | 'whatsapp' | 'story'>(initialMode);
  
  // Initial values loaded from localStorage or default
  const [hookStyle, setHookStyle] = useState<HookStyle>(() => {
    return (localStorage.getItem(STORAGE_KEY_HOOK_STYLE) as HookStyle) || 'open_trip_resmi';
  });

  const [customHookTitle, setCustomHookTitle] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_HOOK_TITLE) || '';
  });

  const [customHookIntro, setCustomHookIntro] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_HOOK_INTRO) || '';
  });

  const [customWaGreeting, setCustomWaGreeting] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_WA_GREETING) || '';
  });

  const [customWaIntro, setCustomWaIntro] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_WA_INTRO) || '';
  });

  const [includeMepo, setIncludeMepo] = useState(true);
  const [includeFacilities, setIncludeFacilities] = useState(true);
  const [includeExclude, setIncludeExclude] = useState(true);
  const [includeSK, setIncludeSK] = useState(true);
  const [includeItinerary, setIncludeItinerary] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Custom full-text override if user edits directly in the right textarea
  const [customText, setCustomText] = useState<string | null>(null);

  // When hook style changes, if user hasn't explicitly customized, or when clicking preset, update input fields
  const handleSelectHookStyle = (styleId: HookStyle) => {
    setHookStyle(styleId);
    setCustomText(null);
    const selectedPreset = HOOK_OPTIONS.find((h) => h.id === styleId);
    if (selectedPreset) {
      setCustomHookTitle(selectedPreset.hookTitle);
      setCustomHookIntro(selectedPreset.introTemplate);
    }
  };

  // Re-generate text when options change
  const generatedCaption = useMemo(() => {
    const opts: CaptionCustomOptions = {
      hookStyle,
      customHookTitle: customHookTitle.trim() ? customHookTitle : undefined,
      customHookIntro: customHookIntro.trim() ? customHookIntro : undefined,
      customWaGreeting: customWaGreeting.trim() ? customWaGreeting : undefined,
      customWaIntro: customWaIntro.trim() ? customWaIntro : undefined,
      includeMepo,
      includeFacilities,
      includeExclude,
      includeSK,
      includeItinerary,
    };

    if (activeTab === 'instagram') {
      return generateInstagramFeedCaption(trip, opts);
    } else if (activeTab === 'whatsapp') {
      return generateWhatsAppBroadcastCaption(trip, opts);
    } else {
      return generateStoryQuickCaption(trip);
    }
  }, [
    trip,
    activeTab,
    hookStyle,
    customHookTitle,
    customHookIntro,
    customWaGreeting,
    customWaIntro,
    includeMepo,
    includeFacilities,
    includeSK,
    includeItinerary,
  ]);

  const activeText = customText !== null ? customText : generatedCaption;

  if (!isOpen) return null;

  const handleTabChange = (tab: 'instagram' | 'whatsapp' | 'story') => {
    setActiveTab(tab);
    setCustomText(null);
  };

  const handleInsertTag = (tag: string, field: 'hookTitle' | 'hookIntro' | 'waIntro') => {
    setCustomText(null);
    if (field === 'hookTitle') {
      setCustomHookTitle((prev) => (prev ? `${prev} ${tag}` : tag));
    } else if (field === 'hookIntro') {
      setCustomHookIntro((prev) => (prev ? `${prev} ${tag}` : tag));
    } else if (field === 'waIntro') {
      setCustomWaIntro((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleSaveCustomStyleToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY_HOOK_STYLE, hookStyle);
      if (customHookTitle) localStorage.setItem(STORAGE_KEY_HOOK_TITLE, customHookTitle);
      if (customHookIntro) localStorage.setItem(STORAGE_KEY_HOOK_INTRO, customHookIntro);
      if (customWaGreeting) localStorage.setItem(STORAGE_KEY_WA_GREETING, customWaGreeting);
      if (customWaIntro) localStorage.setItem(STORAGE_KEY_WA_INTRO, customWaIntro);
      onShowToast('Gaya kata-kata kustom Anda berhasil disimpan untuk trip-trip berikutnya!');
    } catch {
      onShowToast('Gagal menyimpan preferensi kustom');
    }
  };

  const handleResetHookToPreset = () => {
    const selectedPreset = HOOK_OPTIONS.find((h) => h.id === hookStyle) || HOOK_OPTIONS[0];
    setCustomHookTitle(selectedPreset.hookTitle);
    setCustomHookIntro(selectedPreset.introTemplate);
    setCustomText(null);
    onShowToast('Kata-kata pembuka di-reset ke bawaan gaya ' + selectedPreset.label);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setIsCopied(true);
      onShowToast(
        activeTab === 'instagram'
          ? 'Caption Instagram berhasil disalin!'
          : activeTab === 'whatsapp'
          ? 'Pesan WhatsApp Broadcast berhasil disalin!'
          : 'Format Story singkat berhasil disalin!'
      );
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      onShowToast('Gagal menyalin teks ke clipboard');
    }
  };

  const handleOpenWhatsAppDirect = () => {
    const waNumber = (trip.kontak_wa || '+6282230444428').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(activeText);
    window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
  };

  const handleResetToAuto = () => {
    setCustomText(null);
    onShowToast('Teks dikembalikan ke template sinkron otomatis');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#f8fafc] border border-slate-200 w-full max-w-5xl rounded-2xl shadow-xl flex flex-col max-h-[96vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 bg-white/10 rounded-lg">
              <Share2 className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold font-['Montserrat'] tracking-tight truncate">
                Generator Caption & Broadcast Promosi
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Promosi Instan: 🏔️ {trip.nama_gunung.toUpperCase()} {trip.ketinggian_mdpl || ''} · 📌 {trip.jalur.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('instagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'instagram'
                ? 'bg-[#1e4916] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Feed & Reels Instagram</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-[#1e4916] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Broadcast WhatsApp Grup</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('story')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'story'
                ? 'bg-[#1e4916] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Story & Status Singkat</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Customization Controls */}
          <div className="lg:col-span-5 space-y-4">
            {activeTab === 'instagram' && (
              <>
                {/* Hook Selection (Instagram) */}
                <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs font-extrabold font-['Montserrat'] text-[#275d1d] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Pilihan Gaya Hook:
                    </label>
                    <span className="text-[10px] text-gray-500 font-semibold">Klik gaya di bawah:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {HOOK_OPTIONS.map((hook) => (
                      <button
                        key={hook.id}
                        type="button"
                        onClick={() => handleSelectHookStyle(hook.id)}
                        className={`text-left px-2.5 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          hookStyle === hook.id
                            ? 'bg-[#275d1d] border-[#275d1d] text-white shadow-xs'
                            : 'bg-[#f7f7f7] border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="truncate">{hook.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Dedicated Customizer: Own Hook Words & Intro Paragraph */}
                  <div className="pt-2 border-t border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#275d1d] flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        Tulis Kata-Kata Sendiri (Gaya Khas Anda):
                      </span>
                      <button
                        type="button"
                        onClick={handleResetHookToPreset}
                        className="text-[10px] text-gray-500 hover:text-red-600 flex items-center gap-0.5 cursor-pointer"
                        title="Reset ke kata-kata bawaan gaya terpilih"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset Bawaan</span>
                      </button>
                    </div>

                    {/* Judul Hook / Headline */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                        <span>Judul Slogan / Hook Pembuka:</span>
                      </label>
                      <input
                        type="text"
                        value={customHookTitle}
                        onChange={(e) => {
                          setCustomHookTitle(e.target.value);
                          setCustomText(null);
                        }}
                        placeholder="Contoh: YUK GASSS! SAMUDRA DI ATAS AWAN..."
                        className="w-full text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#275d1d] bg-[#fcfcfc]"
                      />
                    </div>

                    {/* Paragraf Pembuka / Ajakan */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                        <span>Paragraf Pembuka / Ajakan:</span>
                      </label>
                      <textarea
                        value={customHookIntro}
                        onChange={(e) => {
                          setCustomHookIntro(e.target.value);
                          setCustomText(null);
                        }}
                        rows={3}
                        placeholder="Tulis kalimat ajakan santai / gaya khas Anda..."
                        className="w-full text-xs font-normal px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#275d1d] bg-[#fcfcfc] leading-relaxed"
                      />
                    </div>

                    {/* Quick Placeholder Variable Buttons */}
                    <div className="bg-[#f2f4f1] p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-600 block mb-1">
                        ⚡ Sisipkan Variabel Otomatis ke Paragraf:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{gunung}', 'hookIntro')}
                          className="px-2 py-0.5 bg-white border border-gray-300 hover:border-[#275d1d] rounded text-[10px] font-bold text-[#275d1d] cursor-pointer"
                        >
                          + {'{gunung}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{jalur}', 'hookIntro')}
                          className="px-2 py-0.5 bg-white border border-gray-300 hover:border-[#275d1d] rounded text-[10px] font-bold text-[#275d1d] cursor-pointer"
                        >
                          + {'{jalur}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{ketinggian}', 'hookIntro')}
                          className="px-2 py-0.5 bg-white border border-gray-300 hover:border-[#275d1d] rounded text-[10px] font-bold text-[#275d1d] cursor-pointer"
                        >
                          + {'{ketinggian}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{tanggal}', 'hookIntro')}
                          className="px-2 py-0.5 bg-white border border-gray-300 hover:border-[#275d1d] rounded text-[10px] font-bold text-[#275d1d] cursor-pointer"
                        >
                          + {'{tanggal}'}
                        </button>
                      </div>
                    </div>

                    {/* Save style button */}
                    <button
                      type="button"
                      onClick={handleSaveCustomStyleToStorage}
                      className="w-full py-1.5 px-3 bg-[#275d1d]/15 hover:bg-[#275d1d]/25 border border-[#275d1d]/40 rounded-lg text-xs font-bold text-[#275d1d] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Gaya Ini (Ingat Untuk Semua Trip)</span>
                    </button>
                  </div>
                </div>

                {/* Content Toggles */}
                <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-xs space-y-3">
                  <span className="text-xs font-extrabold font-['Space_Grotesk'] text-[#275d1d] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Komponen Informasi:
                  </span>

                  <div className="space-y-2 text-xs font-semibold text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeMepo}
                        onChange={(e) => {
                          setIncludeMepo(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Tarif Meeting Point</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeFacilities}
                        onChange={(e) => {
                          setIncludeFacilities(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Fasilitas Include</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeExclude}
                        onChange={(e) => {
                          setIncludeExclude(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Fasilitas Exclude</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeSK}
                        onChange={(e) => {
                          setIncludeSK(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Catatan DP & S&K</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeItinerary}
                        onChange={(e) => {
                          setIncludeItinerary(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Rundown Kegiatan</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'whatsapp' && (
              <>
                {/* Custom WhatsApp Intro */}
                <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-xs space-y-3">
                  <span className="text-xs font-extrabold font-['Space_Grotesk'] text-[#275d1d] flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    Kustom Sapaan & Pesan WhatsApp:
                  </span>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-0.5">
                        Sapaan Awal:
                      </label>
                      <input
                        type="text"
                        value={customWaGreeting}
                        onChange={(e) => {
                          setCustomWaGreeting(e.target.value);
                          setCustomText(null);
                        }}
                        placeholder="Halo Sobat Petualang Cito Adventure! 🌿👋"
                        className="w-full text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#275d1d] bg-[#fcfcfc]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-0.5">
                        Paragraf Pembuka Broadcast:
                      </label>
                      <textarea
                        value={customWaIntro}
                        onChange={(e) => {
                          setCustomWaIntro(e.target.value);
                          setCustomText(null);
                        }}
                        rows={3}
                        placeholder="Open Trip *{gunung} {ketinggian}* via *{jalur}* resmi dibuka kuotanya! Siap-siap nikmati pemandangan sunrise dan lautan awan terbaik."
                        className="w-full text-xs font-normal px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#275d1d] bg-[#fcfcfc] leading-relaxed"
                      />
                    </div>

                    {/* Quick Placeholder Variable Buttons */}
                    <div className="bg-[#f2f4f1] p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-600 block mb-1">
                        ⚡ Sisipkan Variabel:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{gunung}', 'waIntro')}
                          className="px-2 py-0.5 bg-white border border-gray-300 hover:border-[#275d1d] rounded text-[10px] font-bold text-[#275d1d] cursor-pointer"
                        >
                          + {'{gunung}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{jalur}', 'waIntro')}
                          className="px-2 py-0.5 bg-white border border-gray-300 hover:border-[#275d1d] rounded text-[10px] font-bold text-[#275d1d] cursor-pointer"
                        >
                          + {'{jalur}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{ketinggian}', 'waIntro')}
                          className="px-2 py-0.5 bg-white border border-gray-300 hover:border-[#275d1d] rounded text-[10px] font-bold text-[#275d1d] cursor-pointer"
                        >
                          + {'{ketinggian}'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCustomStyleToStorage}
                      className="w-full py-1.5 px-3 bg-[#275d1d]/15 hover:bg-[#275d1d]/25 border border-[#275d1d]/40 rounded-lg text-xs font-bold text-[#275d1d] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Style WhatsApp Ini</span>
                    </button>
                  </div>
                </div>

                {/* Content Toggles for WA */}
                <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-xs space-y-3">
                  <span className="text-xs font-extrabold font-['Space_Grotesk'] text-[#275d1d] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Komponen Broadcast:
                  </span>

                  <div className="space-y-2 text-xs font-semibold text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeMepo}
                        onChange={(e) => {
                          setIncludeMepo(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Tarif Meeting Point</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeFacilities}
                        onChange={(e) => {
                          setIncludeFacilities(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Fasilitas Include</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeExclude}
                        onChange={(e) => {
                          setIncludeExclude(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Fasilitas Exclude</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeSK}
                        onChange={(e) => {
                          setIncludeSK(e.target.checked);
                          setCustomText(null);
                        }}
                        className="w-4 h-4 accent-[#275d1d] rounded"
                      />
                      <span>Sertakan Catatan DP & S&K</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'story' && (
              <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-xs space-y-2 text-xs text-gray-700">
                <span className="font-extrabold text-[#275d1d] block">
                  💡 Format Story & Status Singkat
                </span>
                <p>
                  Didesain padat dan ringkas agar pas dibaca cepat dalam 5-10 detik di Instagram Story atau Status WhatsApp.
                </p>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-[#275d1d]/10 border border-[#275d1d]/30 rounded-xl p-3.5 text-[11px] text-[#1a3814] space-y-1">
              <strong className="block font-bold">Tips Gaya Promosi:</strong>
              <p>
                Gunakan variabel <code className="bg-white px-1 py-0.5 rounded font-mono text-[#275d1d] font-bold">{'{gunung}'}</code> dan <code className="bg-white px-1 py-0.5 rounded font-mono text-[#275d1d] font-bold">{'{jalur}'}</code> agar kalimat promosi khas Anda otomatis berubah sesuai gunung yang sedang dipromosikan!
              </p>
            </div>
          </div>

          {/* Right Column: Live Caption Preview & Editor */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div className="bg-white border-2 border-[#275d1d] rounded-xl p-4 shadow-xs flex-1 flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between gap-2 border-b border-[#275d1d]/20 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-700">
                    {customText !== null ? '✏️ Mode Edit Langsung (Manual)' : '✨ Pratinjau Teks Sinkron Otomatis'}
                  </span>
                </div>

                {customText !== null && (
                  <button
                    type="button"
                    onClick={handleResetToAuto}
                    className="text-[11px] font-bold text-[#275d1d] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Kembalikan ke Sinkron Otomatis</span>
                  </button>
                )}
              </div>

              {/* Editable Textarea */}
              <textarea
                value={activeText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full flex-1 p-3 font-mono text-xs sm:text-[13px] text-gray-800 leading-relaxed border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#275d1d] resize-none bg-[#fafafa]"
                rows={16}
                placeholder="Teks caption..."
              />

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 font-mono">
                <span>{activeText.length} karakter</span>
                <span>{activeText.split(/\s+/).filter(Boolean).length} kata</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-4 bg-[#1e4916] hover:bg-[#15340f] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Teks Caption'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsAppDirect}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                title="Buka WhatsApp dengan pesan ini"
              >
                <ExternalLink className="w-4 h-4 text-white" />
                <span>Kirim ke WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
