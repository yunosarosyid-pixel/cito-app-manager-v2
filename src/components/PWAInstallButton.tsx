import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide if already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Edge / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-2 rounded bg-white px-3.5 py-1.5 text-xs md:text-sm font-extrabold text-[#275d1d] shadow hover:bg-[#f0f0f0] transition-all cursor-pointer"
        title="Install Aplikasi Cito Adventure ke HP / Desktop"
      >
        <Download className="w-4 h-4 text-[#275d1d]" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded border border-white/40 bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25 transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-white" />
          <span>Install di iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl bg-white border-2 border-[#275d1d] p-6 shadow-2xl text-[#1a2e16]">
              <div className="flex items-center justify-between mb-3 border-b pb-2 border-[#275d1d]/20">
                <h3 className="text-base font-extrabold font-['Montserrat'] tracking-tight text-[#275d1d]">Install di iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-gray-500 hover:text-black p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed space-y-2">
                1. Buka website ini di <strong>Safari</strong>.<br />
                2. Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah browser.<br />
                3. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded bg-[#275d1d] py-2 text-xs font-bold text-white hover:bg-[#1f4a17] transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
