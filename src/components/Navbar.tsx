import React, { useState, useEffect, useRef } from 'react';
import { Plus, Archive, Github, DownloadCloud, Camera, RotateCcw, Cloud, CloudCheck, RefreshCw, Link2, Bell, Users, Key, Lock } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { downloadProjectZip } from '../utils/projectZip';
import { getCustomLogo, setCustomLogo, clearCustomLogo, OFFICIAL_LOGO_URL } from '../utils/storage';
import { optimizeLogoImage } from '../utils/imageOptimizer';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenGithubGuide: () => void;
  tripCount: number;
  draftCount?: number;
  onScrollToDrafts?: () => void;
  adminDraftCount?: number;
  onScrollToAdminDrafts?: () => void;
  cloudStatus?: 'synced' | 'syncing' | 'offline' | 'quota_exceeded';
  onOpenCloudSync?: () => void;
  onCopyTeamLink?: () => void;
  onCopyAdminKeyLink?: () => void;
  onLockToTeamMode?: () => void;
  onOpenTeamMode?: () => void;
  onOpenTeamData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenGithubGuide,
  tripCount,
  draftCount = 0,
  onScrollToDrafts,
  adminDraftCount = 0,
  onScrollToAdminDrafts,
  cloudStatus = 'synced',
  onOpenCloudSync,
  onCopyTeamLink,
  onCopyAdminKeyLink,
  onLockToTeamMode,
  onOpenTeamMode,
  onOpenTeamData,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(getCustomLogo() || OFFICIAL_LOGO_URL);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateLogo = () => {
      const custom = getCustomLogo();
      if (custom) {
        setLogoSrc(custom);
        setIsCustom(true);
      } else {
        setLogoSrc(OFFICIAL_LOGO_URL);
        setIsCustom(false);
      }
    };

    updateLogo();
    window.addEventListener('cito_logo_updated', updateLogo);
    return () => window.removeEventListener('cito_logo_updated', updateLogo);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar valid (PNG, JPG, WebP)');
      return;
    }

    try {
      const optimized = await optimizeLogoImage(file);
      // 1. Update memory, IndexedDB, and Cloud Firestore
      setCustomLogo(optimized);

      // 2. Persist directly to server disk (public/logo.png, etc.) so it never reverts on restart
      await fetch('/api/save-permanent-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: optimized }),
      }).catch((err) => {
        console.warn('Could not write permanent logo to server disk:', err);
      });
    } catch (err) {
      console.error('Failed to process logo', err);
      alert('Gagal memproses gambar logo');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Kembalikan logo ke logo bawaan?')) {
      clearCustomLogo();
    }
  };

  return (
    <header className="bg-[#1b4313] border-b border-[#14320e] text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Brand with interactive Cito Adventure logo upload */}
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer shrink-0"
            title="Klik untuk ganti logo Cito Adventure"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/20 group-hover:border-white/40 transition-colors">
              <img
                src={logoSrc}
                alt="Logo Cito Adventure Madiun"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>

            {/* Custom Logo Badge & Reset */}
            {isCustom && (
              <button
                type="button"
                onClick={handleResetLogo}
                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[10px] leading-none shadow-xs cursor-pointer"
                title="Reset logo ke bawaan"
              >
                ×
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-emerald-200 uppercase font-['Space_Grotesk']">
                CITO ADVENTURE MADIUN
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[9px] px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white/90 font-medium cursor-pointer transition-colors"
                title="Klik untuk unggah logo resmi"
              >
                {isCustom ? 'Logo Kustom' : 'Ganti Logo'}
              </button>
            </div>
            <h1 className="text-base sm:text-lg font-bold font-['Montserrat'] tracking-tight text-white leading-tight">
              Cito Trip Manager
            </h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Cloud Sync Status Indicator */}
          <button
            type="button"
            onClick={onOpenCloudSync}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              cloudStatus === 'synced'
                ? 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-500/40'
                : cloudStatus === 'syncing'
                ? 'bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border-amber-500/40'
                : cloudStatus === 'quota_exceeded'
                ? 'bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 border-amber-400/50'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-600/40'
            }`}
            title="Status Cloud Firestore & Offline Cache"
          >
            {cloudStatus === 'synced' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Cloud Online</span>
              </>
            )}
            {cloudStatus === 'syncing' && (
              <>
                <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                <span>Menyimpan...</span>
              </>
            )}
            {cloudStatus === 'quota_exceeded' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Mode Offline (Kuota)</span>
              </>
            )}
            {cloudStatus === 'offline' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Offline Cache</span>
              </>
            )}
          </button>

          <PWAInstallButton />

          {/* Notifikasi Masukan dari Tim */}
          {draftCount > 0 && (
            <button
              type="button"
              onClick={onScrollToDrafts}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-xs cursor-pointer transition-colors"
              title={`${draftCount} Draf jadwal baru dari tim lapangan menunggu persetujuan`}
            >
              <Bell className="w-3.5 h-3.5 fill-amber-950" />
              <span>{draftCount} Draf Tim</span>
            </button>
          )}

          {/* Notifikasi Draft Saya Sendiri */}
          {adminDraftCount > 0 && (
            <button
              type="button"
              onClick={onScrollToAdminDrafts}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-colors"
              title={`${adminDraftCount} Trip buatan saya masih berstatus Draft`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{adminDraftCount} Draft Admin</span>
            </button>
          )}

          {/* Tombol Beralih ke Form Tim */}
          {onOpenTeamMode && (
            <button
              type="button"
              onClick={onOpenTeamMode}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-colors cursor-pointer"
              title="Buka Lembar Kerja Formulir Input Tim Lapangan"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>Form Tim</span>
            </button>
          )}

          {onCopyTeamLink && (
            <button
              type="button"
              onClick={onCopyTeamLink}
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/30 transition-colors cursor-pointer"
              title="Salin Link Khusus untuk Tim Penginput Jadwal (?mode=tim)"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Link Tim</span>
            </button>
          )}

          {onOpenTeamData && (
            <button
              id="team-data-btn"
              type="button"
              onClick={onOpenTeamData}
              className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
              title="Kelola Nomor Admin & Data Anggota Tim"
            >
              <Users className="w-3.5 h-3.5 text-white/90" />
              <span>Data Tim</span>
            </button>
          )}

          {onCopyAdminKeyLink && (
            <button
              type="button"
              onClick={onCopyAdminKeyLink}
              className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-emerald-200 border border-emerald-400/30 transition-colors cursor-pointer"
              title="Salin Link Kunci Rahasia Pemilik Mas Yuno"
            >
              <Key className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kunci Admin</span>
            </button>
          )}

          {onLockToTeamMode && (
            <button
              type="button"
              onClick={onLockToTeamMode}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-black/25 hover:bg-black/35 text-white/80 border border-white/15 transition-colors cursor-pointer"
              title="Kunci perangkat ini kembali ke Mode Tim Lapangan"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline">Kunci Tim</span>
            </button>
          )}

          <button
            id="download-zip-btn"
            onClick={downloadProjectZip}
            className="hidden 2xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
            title="Download seluruh source code aplikasi dalam format .ZIP"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-white/90" />
            <span>ZIP</span>
          </button>

          <button
            id="github-guide-btn"
            onClick={onOpenGithubGuide}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
            title="Panduan push ke Repository GitHub"
          >
            <Github className="w-3.5 h-3.5 text-white/90" />
            <span>GitHub</span>
          </button>

          <button
            id="add-trip-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white hover:bg-slate-100 text-[#1b4313] transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#1b4313]" />
            <span>Tambah Trip</span>
          </button>
        </div>
      </div>
    </header>
  );
};
