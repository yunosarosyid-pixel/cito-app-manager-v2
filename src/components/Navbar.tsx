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
    <header className="bg-[#275d1d] border-b-2 border-[#1e4916] text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
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
            className="relative group cursor-pointer"
            title="Klik untuk ganti logo Cito Adventure"
          >
            <img
              src={logoSrc}
              alt="Logo Cito Adventure Madiun"
              className="w-12 h-12 sm:w-13 sm:h-13 object-contain drop-shadow-md shrink-0 transition-transform group-hover:scale-105"
            />
            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 bg-black/55 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white drop-shadow" />
            </div>

            {/* Custom Logo Badge & Reset */}
            {isCustom && (
              <button
                type="button"
                onClick={handleResetLogo}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[9px] shadow-sm cursor-pointer"
                title="Reset logo ke bawaan"
              >
                ×
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-white/90 uppercase font-['Montserrat']">
                Cito Adventure Madiun
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-medium cursor-pointer transition-colors"
                title="Klik untuk unggah logo resmi"
              >
                {isCustom ? 'Logo Kustom Aktif' : 'Ganti Logo'}
              </button>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold font-['Montserrat'] tracking-tight text-white leading-tight">
              Cito Trip Manager V2
            </h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Cloud Sync Status Indicator */}
          <button
            type="button"
            onClick={onOpenCloudSync}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-sm hover:scale-102 active:scale-98 ${
              cloudStatus === 'synced'
                ? 'bg-white/20 hover:bg-white/30 text-emerald-100 border-white/40'
                : cloudStatus === 'syncing'
                ? 'bg-amber-400/25 hover:bg-amber-400/35 text-amber-200 border-amber-300/40'
                : cloudStatus === 'quota_exceeded'
                ? 'bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 border-amber-300/50'
                : 'bg-gray-600/40 hover:bg-gray-600/50 text-gray-200 border-gray-400/30'
            }`}
            title="Klik untuk Sinkronisasi HP & Laptop / Info Cloud & Kuota"
          >
            {cloudStatus === 'synced' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Cloud Sinkron</span>
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
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Mode Offline (Kuota Cloud)</span>
              </>
            )}
            {cloudStatus === 'offline' && (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span>Offline Cache</span>
              </>
            )}
          </button>

          <PWAInstallButton />

          {/* Mode Admin Badge */}
          <div className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-900/60 border border-emerald-400/30 text-emerald-200">
            <span>🛡️ Mode Admin</span>
          </div>

          {/* Tombol Cepat Beralih ke Form Tim */}
          {onOpenTeamMode && (
            <button
              type="button"
              onClick={onOpenTeamMode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 hover:bg-white/30 text-white border border-white/35 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Buka Lembar Kerja Formulir Input Tim Lapangan"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>Form Tim</span>
            </button>
          )}

          {/* 1. Notifikasi Masukan dari Tim (Amber / Emas Streamer) */}
          {draftCount > 0 && (
            <button
              type="button"
              onClick={onScrollToDrafts}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-md animate-bounce cursor-pointer transition-transform active:scale-95"
              title={`${draftCount} Draf jadwal baru dari tim lapangan menunggu persetujuan`}
            >
              <Bell className="w-3.5 h-3.5 fill-amber-950" />
              <span>👥 {draftCount} Draf Tim</span>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute -top-0.5 -right-0.5" />
            </button>
          )}

          {/* 2. Notifikasi Draft Saya Sendiri (Merah Tegas) */}
          {adminDraftCount > 0 && (
            <button
              type="button"
              onClick={onScrollToAdminDrafts}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer transition-transform active:scale-95 border border-red-400"
              title={`${adminDraftCount} Trip buatan saya masih berstatus Draft`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>🔴 {adminDraftCount} Draft Saya</span>
            </button>
          )}

          {onCopyTeamLink && (
            <button
              type="button"
              onClick={onCopyTeamLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-sm border border-amber-500/40 transition-all cursor-pointer active:scale-95"
              title="Salin Link Khusus untuk Tim Penginput Jadwal (?mode=tim)"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-950" />
              <span>Link Form Tim</span>
            </button>
          )}

          {onCopyAdminKeyLink && (
            <button
              type="button"
              onClick={onCopyAdminKeyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm border border-emerald-300/40 transition-all cursor-pointer active:scale-95"
              title="Salin Link Kunci Rahasia Pemilik Mas Yuno"
            >
              <Key className="w-3.5 h-3.5 text-white" />
              <span>Kunci Akses Mas Yuno</span>
            </button>
          )}

          {onLockToTeamMode && (
            <button
              type="button"
              onClick={onLockToTeamMode}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-black/20 hover:bg-black/30 text-white/90 border border-white/20 transition-all cursor-pointer"
              title="Kunci perangkat ini kembali ke Mode Tim Lapangan"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline">Kunci Mode Tim</span>
            </button>
          )}

          {onOpenTeamData && (
            <button
              id="team-data-btn"
              type="button"
              onClick={onOpenTeamData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-white/20 hover:bg-white/30 text-white border border-white/35 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Kelola Nomor Admin & Data Anggota Tim"
            >
              <Users className="w-3.5 h-3.5 text-white" />
              <span>Data Tim</span>
            </button>
          )}

          <button
            id="download-zip-btn"
            onClick={downloadProjectZip}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 transition-colors cursor-pointer"
            title="Download seluruh source code aplikasi dalam format .ZIP"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-white" />
            <span>Unduh File ZIP</span>
          </button>

          <button
            id="github-guide-btn"
            onClick={onOpenGithubGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 transition-colors cursor-pointer"
            title="Panduan push ke Repository GitHub"
          >
            <Github className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Repo GitHub</span>
          </button>

          <button
            id="add-trip-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs sm:text-sm font-extrabold bg-white hover:bg-[#f0f0f0] text-[#275d1d] transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#275d1d]" />
            <span>Tambah Trip</span>
          </button>
        </div>
      </div>
    </header>
  );
};
