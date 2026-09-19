import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Smartphone,
  Laptop,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Trip } from '../types';
import { uploadAllTripsToCloud, fetchAllCloudTrips, saveTripToCloud } from '../firebase';
import { ADMIN_SECRET } from '../utils/storage';
import {
  getDeletedTripIds,
  saveStoredTrips,
  sortTripsByDepartureDate,
  clearAllDeletedTripIds,
} from '../utils/storage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrips: Trip[];
  onTripsUpdated: (trips: Trip[]) => void;
  cloudStatus: 'synced' | 'syncing' | 'offline' | 'quota_exceeded';
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentTrips,
  onTripsUpdated,
  cloudStatus,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const adminUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?admin=${ADMIN_SECRET}`
    : '';

  useEffect(() => {
    if (isOpen && adminUrl) {
      QRCode.toDataURL(adminUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#143811',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, adminUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualUpload = async () => {
    try {
      setIsUploading(true);
      setStatusMessage(null);
      const count = await uploadAllTripsToCloud(currentTrips);
      setStatusMessage(`✓ Berhasil mengunggah ${count} data trip dari perangkat ini ke Cloud Database!`);
    } catch (err) {
      console.error('Upload failed:', err);
      setStatusMessage('⚠️ Gagal mengunggah ke Cloud. Pastikan koneksi internet stabil.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualDownload = async () => {
    try {
      setIsDownloading(true);
      setStatusMessage(null);
      const cloudTrips = await fetchAllCloudTrips();
      if (cloudTrips.length > 0) {
        // Smart Merge: never overwrite local pending trips!
        const deletedIds = getDeletedTripIds();
        const validCloudTrips = cloudTrips.filter((t) => !deletedIds.has(t.id));
        const cloudMap = new Map<string, Trip>(validCloudTrips.map((t) => [t.id, t]));

        const localPendingTrips: Trip[] = [];
        for (const localTrip of currentTrips) {
          if (!deletedIds.has(localTrip.id) && !cloudMap.has(localTrip.id)) {
            localPendingTrips.push(localTrip);
          }
        }

        const merged = sortTripsByDepartureDate([...validCloudTrips, ...localPendingTrips]);

        onTripsUpdated(merged);
        saveStoredTrips(merged);

        if (localPendingTrips.length > 0) {
          // Auto-upload local-only trips to cloud
          for (const pending of localPendingTrips) {
            saveTripToCloud(pending).catch(console.warn);
          }
          setStatusMessage(`✓ Berhasil mengambil ${validCloudTrips.length} trip dari Cloud! ${localPendingTrips.length} trip lokal Anda tetap aman & otomatis diunggah.`);
        } else {
          setStatusMessage(`✓ Berhasil menyinkronkan ${validCloudTrips.length} data trip dari Cloud Database!`);
        }
      } else {
        setStatusMessage('ℹ️ Database Cloud masih kosong. Silakan gunakan tombol "Unggah Data Ini ke Cloud" untuk mengisinya.');
      }
    } catch (err) {
      console.error('Download failed:', err);
      setStatusMessage('⚠️ Gagal mengambil data Cloud. Pastikan koneksi internet stabil.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResetAndFetchPureCloud = async () => {
    if (
      !confirm(
        'Bersihkan cache lokal perangkat ini dan samakan persis dengan Cloud (Laptop)?\n\nSemua trip contoh bawaan di HP akan dibersihkan, dan daftar trip akan 100% identik dengan Cloud Firestore.'
      )
    ) {
      return;
    }

    try {
      setIsDownloading(true);
      setStatusMessage('Sedang membersihkan cache lokal & menyamakan dengan Cloud...');
      clearAllDeletedTripIds();

      const cloudTrips = await fetchAllCloudTrips();
      if (cloudTrips.length > 0) {
        const sorted = sortTripsByDepartureDate(cloudTrips);
        onTripsUpdated(sorted);
        saveStoredTrips(sorted);
        setStatusMessage(`✓ Berhasil! Cache lokal dibersihkan. Sekarang perangkat ini 100% sinkron (${sorted.length} trip dari Cloud).`);
      } else {
        setStatusMessage('ℹ️ Database Cloud kosong. Unggah trip dari Laptop terlebih dahulu.');
      }
    } catch (err) {
      console.error('Reset & cloud sync error:', err);
      setStatusMessage('⚠️ Gagal mengambil data Cloud. Periksa koneksi internet.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      id="cloud-sync-modal-backdrop"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="cloud-sync-modal-card"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#143811] to-[#275d1d] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <Cloud className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Sinkronisasi Cloud (HP & Laptop)</h2>
              <p className="text-[11px] text-emerald-100/90">
                Penyimpanan online real-time Cito Adventure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Bar */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border ${
              cloudStatus === 'quota_exceeded'
                ? 'bg-amber-50 border-amber-300'
                : cloudStatus === 'offline'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  cloudStatus === 'quota_exceeded'
                    ? 'bg-amber-500'
                    : cloudStatus === 'offline'
                    ? 'bg-gray-400'
                    : 'bg-emerald-500'
                } animate-pulse`}
              />
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {cloudStatus === 'quota_exceeded'
                    ? 'Batas Kuota Cloud Harian (Cache Offline Aktif)'
                    : cloudStatus === 'offline'
                    ? 'Mode Offline Cache'
                    : 'Cloud Firestore Aktif'}
                </p>
                <p className="text-[11px] text-gray-600">
                  {currentTrips.length} trip tersimpan di IndexedDB & memori perangkat ini
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                cloudStatus === 'quota_exceeded'
                  ? 'bg-amber-200 text-amber-900'
                  : cloudStatus === 'offline'
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-emerald-200/80 text-emerald-900'
              }`}
            >
              {cloudStatus === 'quota_exceeded' ? 'Quota Exceeded' : cloudStatus === 'offline' ? 'Offline' : 'Real-time'}
            </span>
          </div>

          {/* Quota Exceeded Explanation Notice */}
          {cloudStatus === 'quota_exceeded' && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Cloud className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Batas Kuota Baca Cloud Gratis Tercapai untuk Hari Ini</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Batas baca harian Firestore gratis (Free daily read units) telah habis untuk hari ini.
                <strong> Data Anda 100% aman:</strong> aplikasi secara otomatis dan transparan beralih menggunakan memori & IndexedDB lokal sehingga Anda tetap dapat membuka trip, mengedit, membuat poster pamflet, dan ekspor.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                <a
                  href="https://console.firebase.google.com/project/citoappmanagerv2/firestore/databases/-default-/data"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#275d1d] font-bold underline hover:text-[#1e4817]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka Konsol Database Firebase / Upgrade</span>
                </a>
                <span className="text-amber-400">•</span>
                <span className="text-amber-800">Kuota gratis akan di-reset otomatis besok hari</span>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                statusMessage.startsWith('✓')
                  ? 'bg-green-100 text-green-900 border border-green-300'
                  : statusMessage.startsWith('⚠️')
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              {statusMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleManualUpload}
              disabled={isUploading || isDownloading}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4 text-emerald-200" />
              )}
              <span>Unggah Data Ini ke Cloud</span>
            </button>

            <button
              onClick={handleManualDownload}
              disabled={isDownloading || isUploading}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all border border-gray-300 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <DownloadCloud className="w-4 h-4 text-gray-600" />
              )}
              <span>Tarik Data Terbaru Cloud</span>
            </button>
          </div>

          {/* Quick Fix Button: Samakan Persis dengan Cloud */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-red-600" />
                  <span>Samakan Persis dengan Laptop / Cloud</span>
                </p>
                <p className="text-[11px] text-red-700/90 leading-tight mt-0.5">
                  Jika di HP muncul trip dummy/sampel berlebih, klik tombol ini untuk membersihkan cache HP dan mengambil murni data trip asli dari Cloud.
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAndFetchPureCloud}
              disabled={isDownloading || isUploading}
              className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
              <span>Bersihkan Cache & Samakan Persis dengan Cloud</span>
            </button>
          </div>

          {/* Practical Explanation for Laptop & HP */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Cara Menyamakan Data Laptop & HP:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-amber-900/90 leading-relaxed">
              <li>
                <strong>Di Laptop:</strong> Klik tombol hijau <em>"Unggah Data Ini ke Cloud"</em> di atas agar trip yang sudah Anda buat di laptop tersimpan ke database online.
              </li>
              <li>
                <strong>Di HP:</strong> Buka link yang <u>sama persis</u> dengan di laptop (scan QR Code di bawah).
              </li>
              <li>
                <strong>Selesai:</strong> Begitu halaman di HP terbuka, HP akan otomatis membaca data trip yang sama dari Cloud.
              </li>
            </ol>
          </div>

          {/* QR Code Section to Open on Phone */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-800">
              <Smartphone className="w-4 h-4 text-[#275d1d]" />
              <span>Buka Langsung di HP Anda (Akses Admin Mas Yuno)</span>
            </div>
            <p className="text-[11px] text-gray-600 max-w-sm mx-auto leading-relaxed">
              Scan barcode di bawah dengan kamera HP pribadi Mas Yuno. Barcode ini otomatis menyertakan <strong>kunci akses admin</strong> sehingga HP Mas Yuno langsung terbuka sebagai Admin penuh:
            </p>

            <div className="flex justify-center">
              {qrCodeDataUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 inline-block">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code Buka di HP Mas Yuno"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-36 h-36 bg-gray-200 animate-pulse rounded-xl mx-auto flex items-center justify-center text-xs text-gray-400">
                  Memuat QR...
                </div>
              )}
            </div>

            {/* URL Copy Box */}
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input
                type="text"
                readOnly
                value={adminUrl}
                className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-600 font-mono select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 bg-[#275d1d] hover:bg-[#1e4817] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
