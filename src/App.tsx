/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TripCard } from './components/TripCard';
import { TripDetail } from './components/TripDetail';
import { TripModal } from './components/TripModal';
import { ItineraryModal } from './components/ItineraryModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toast } from './components/Toast';
import { TeamInputView } from './components/TeamInputView';
import { TeamDataModal } from './components/TeamDataModal';
import { MediaKitView } from './components/MediaKitView';
import { findTripBySlugOrId, getTripSlug, getTripMediaKitUrl } from './utils/slug';
import { Trip, TripStatus } from './types';
import {
  getStoredTrips,
  saveStoredTrips,
  resetToDefaultTrips,
  syncCloudLogoToLocal,
  getDeletedTripIds,
  recordDeletedTripId,
  unrecordDeletedTripId,
  isMasYunoAuthenticated,
  setMasYunoAuthenticated,
  checkAdminAccessInUrl,
  ADMIN_SECRET,
  sortTripsByDepartureDate,
} from './utils/storage';
import {
  subscribeToCloudTrips,
  saveTripToCloud,
  deleteTripFromCloud,
  seedInitialTripsToCloud,
  subscribeToCloudLogo,
} from './firebase';
import { playIncomingDraftChime } from './utils/audioNotify';
import { Search, Plus, Filter, Mountain, ArrowLeft, RotateCcw, Bell, X, CheckCircle, Link2, Cloud } from 'lucide-react';

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const urlTripId = params.get('trip');
    if (urlTripId) return urlTripId;
    try {
      return localStorage.getItem('cito_active_trip_id') || null;
    } catch {
      return null;
    }
  });
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState<'semua' | 'admin' | 'tim' | 'draft' | 'final'>('semua');
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline' | 'quota_exceeded'>('synced');
  const [viewMode, setViewMode] = useState<'admin' | 'tim'>(() => {
    if (typeof window === 'undefined') return 'admin';
    const params = new URLSearchParams(window.location.search);
    // Explicit query parameters
    if (params.get('mode') === 'tim' || window.location.hash === '#tim') {
      return 'tim';
    }
    // Check secret in URL
    const hasSecret = checkAdminAccessInUrl(window.location.search, window.location.hash);
    if (hasSecret) {
      setMasYunoAuthenticated(true);
      return 'admin';
    }
    // Check saved mode
    try {
      const savedMode = localStorage.getItem('cito_view_mode');
      if (savedMode === 'tim') return 'tim';
      if (savedMode === 'admin') return 'admin';
    } catch {}
    // Default to admin mode for Mas Yuno
    return 'admin';
  });
  const isTeamMode = viewMode === 'tim';
  const [isDraftBannerDismissed, setIsDraftBannerDismissed] = useState(false);
  const knownDraftIdsRef = useRef<Set<string>>(new Set());

  // Modals state
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [itineraryTrip, setItineraryTrip] = useState<Trip | null>(null);
  const [isGithubGuideOpen, setIsGithubGuideOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isTeamDataModalOpen, setIsTeamDataModalOpen] = useState(false);
  const [previewMediaKitTrip, setPreviewMediaKitTrip] = useState<Trip | null>(null);
  const [activeMediaKitTripId, setActiveMediaKitTripId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('kit') || params.get('mediakit') || null;
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile view toggle ('list' | 'detail'). Kalau halaman dibuka lewat deep-link
  // eksplisit (?trip=xxx, mis. dari tombol "Salin Link Kit"), langsung ke detail
  // trip tersebut. Selain itu (refresh biasa, atau setelah hapus trip), selalu
  // mulai dari Daftar Trip — sebelumnya nilai 'detail' tersisa di URL dari sesi
  // sebelumnya membuat tampilan "nyangkut" di tab Detail & Export walau trip
  // yang aktif sudah berbeda/terhapus.
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>(() => {
    if (typeof window === 'undefined') return 'list';
    const params = new URLSearchParams(window.location.search);
    return params.get('trip') ? 'detail' : 'list';
  });

  // Sinkronisasi selectedTripId & mobileTab ke URL query params & localStorage agar tahan refresh di HP & PC
  const handleSelectTrip = useCallback((tripId: string, tab?: 'list' | 'detail') => {
    setSelectedTripId(tripId);
    try {
      localStorage.setItem('cito_active_trip_id', tripId);
    } catch {}

    const newTab = tab || 'detail';
    setMobileTab(newTab);

    // Update URL tanpa reload halaman. Simpan trip id saja (untuk deep-link/
    // share), TIDAK menyimpan tab, supaya refresh halaman selalu mulai dari
    // Daftar Trip di mobile, bukan nyangkut di tab Detail & Export dari sesi
    // sebelumnya (mis. setelah trip yang sedang dilihat dihapus).
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('trip', tripId);
      url.searchParams.delete('tab');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    // Bersihkan sisa parameter ?tab=detail dari URL sesi sebelumnya, supaya
    // tampilan selalu mulai dari Daftar Trip saat halaman dibuka/refresh.
    // Parameter ?trip=xxx tetap dipertahankan untuk deep-link ke trip tertentu.
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('tab')) {
        url.searchParams.delete('tab');
        window.history.replaceState({}, '', url.toString());
      }
    }
    // 1. Instant local read so app renders immediately without empty flash
    const localTrips = sortTripsByDepartureDate(getStoredTrips());
    setTrips(localTrips);
    if (localTrips.length > 0) {
      setSelectedTripId((prev) => {
        if (prev && localTrips.some((t) => t.id === prev)) {
          return prev;
        }
        return localTrips[0].id;
      });
    }
    // Seed initial draft IDs so existing drafts don't trigger sound on first page open
    const initialDrafts = localTrips.filter((t) => t.is_draft);
    initialDrafts.forEach((t) => knownDraftIdsRef.current.add(t.id));

    // Mode Tim hanya mengirim form (tulis saja), tidak perlu membaca semua trip dari cloud.
    // Melewati listener di sini menghemat sekitar 39 read setiap link form dibuka.
    if (isTeamMode) {
      return;
    }

    // 2. Real-time Cloud Firestore subscription with Offline-First SMART MERGE
    let isInitialFetch = true;
    const unsubscribeTrips = subscribeToCloudTrips(
      (cloudTrips) => {
        setCloudStatus('synced');
        const deletedIds = getDeletedTripIds();
        const currentLocals = getStoredTrips();

        // Filter out any cloud trips that were explicitly deleted on this device
        const validCloudTrips = cloudTrips.filter((t) => !deletedIds.has(t.id));
        const cloudTripMap = new Map<string, Trip>(validCloudTrips.map((t) => [t.id, t]));

        // SMART MERGE: Find any REAL user-created trips that exist locally but are NOT yet in Cloud
        // (e.g. newly created on HP while offline). Never re-upload obsolete hardcoded dummy trips!
        const DUMMY_IDS = new Set(['sindoro-watu-lunyu', 'sumbing-butuh', 'merbabu-suwanting']);
        const localPendingTrips: Trip[] = [];
        for (const localTrip of currentLocals) {
          if (
            !deletedIds.has(localTrip.id) &&
            !cloudTripMap.has(localTrip.id) &&
            // If Cloud already has data, ignore legacy dummy sample trips lingering in local storage
            !(validCloudTrips.length > 0 && DUMMY_IDS.has(localTrip.id))
          ) {
            localPendingTrips.push(localTrip);
          }
        }

        // Combined safe dataset (sorted by departure date)
        const mergedTrips = sortTripsByDepartureDate([...validCloudTrips, ...localPendingTrips]);

        // Detect newly incoming drafts specifically submitted by the TEAM (real-time alert)
        const incomingTeamDrafts = mergedTrips.filter(
          (t) => t.is_draft && t.from_team && !knownDraftIdsRef.current.has(t.id)
        );
        if (incomingTeamDrafts.length > 0) {
          // Add to known drafts
          incomingTeamDrafts.forEach((t) => knownDraftIdsRef.current.add(t.id));

          // If not initial fetch, trigger sound and un-dismiss banner
          if (!isInitialFetch) {
            playIncomingDraftChime();
            setIsDraftBannerDismissed(false);
            const latest = incomingTeamDrafts[0];
            showToast(`🔔 Draf baru masuk dari tim: ${latest.nama_gunung} (${latest.jalur})!`);
          }
        }

        setTrips(mergedTrips);
        saveStoredTrips(mergedTrips);
        setSelectedTripId((prev) => {
          if (prev && mergedTrips.some((t) => t.id === prev)) {
            return prev;
          }
          return mergedTrips[0]?.id || null;
        });

        // Auto-upload any local trips that are not yet in Cloud
        if (localPendingTrips.length > 0) {
          console.info(`[Cloud Sync] Auto-uploading ${localPendingTrips.length} local trip(s) to Cloud Database...`);
          for (const pending of localPendingTrips) {
            saveTripToCloud(pending).catch((err) => {
              console.warn(`[Cloud Sync] Auto upload failed for trip ${pending.id}:`, err);
            });
          }
        } else if (isInitialFetch && validCloudTrips.length === 0 && currentLocals.length > 0) {
          // If Cloud Firestore is totally empty on initial connection, upload existing trips
          setCloudStatus('syncing');
          seedInitialTripsToCloud(currentLocals).finally(() => {
            setCloudStatus('synced');
          });
        }
        isInitialFetch = false;
      },
      (error) => {
        const errMsg = String((error as { message?: string })?.message || error || '');
        const isQuota =
          errMsg.toLowerCase().includes('quota') ||
          (error as { code?: string })?.code === 'resource-exhausted';
        if (isQuota) {
          console.warn('Firestore daily read quota limit reached. Offline mode is active.');
          setCloudStatus('quota_exceeded');
        } else {
          console.warn('Cloud sync error or offline:', error);
          setCloudStatus('offline');
        }
      }
    );

    // 3. Real-time Logo synchronization across devices
    const unsubscribeLogo = subscribeToCloudLogo((cloudLogo) => {
      syncCloudLogoToLocal(cloudLogo);
    });

    return () => {
      unsubscribeTrips();
      unsubscribeLogo();
    };
  }, [isTeamMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const handleSaveTrip = (savedTrip: Trip) => {
    unrecordDeletedTripId(savedTrip.id);
    // Mark as already known so local admin draft saves never trigger incoming team alert
    knownDraftIdsRef.current.add(savedTrip.id);

    const exists = trips.some((t) => t.id === savedTrip.id);
    let updated: Trip[];
    const authorTag = savedTrip.from_team ? '(Draf Tim)' : '(Dari Admin)';
    if (exists) {
      updated = trips.map((t) => (t.id === savedTrip.id ? savedTrip : t));
      const statusText = savedTrip.is_draft ? '🔴 Draft diperbarui' : '🟢 Trip diperbarui';
      showToast(`${statusText} ${authorTag}: ${savedTrip.nama_gunung} (Tersinkron ke Cloud)`);
    } else {
      updated = [savedTrip, ...trips];
      const statusText = savedTrip.is_draft ? '🔴 Draft baru tersimpan' : '🟢 Trip baru ditambahkan';
      showToast(`${statusText} ${authorTag}: ${savedTrip.nama_gunung} (Tersinkron ke Cloud)`);
    }
    updated = sortTripsByDepartureDate(updated);
    setTrips(updated);
    saveStoredTrips(updated);
    handleSelectTrip(savedTrip.id, 'detail');

    // Sync directly to Cloud Firestore in background
    setCloudStatus('syncing');
    saveTripToCloud(savedTrip)
      .then(() => {
        setCloudStatus('synced');
      })
      .catch((err) => {
        console.error('Failed to sync trip to cloud:', err);
        setCloudStatus('offline');
      });
  };

  const handleDeleteTrip = (id: string) => {
    recordDeletedTripId(id);
    const updated = trips.filter((t) => t.id !== id);
    setTrips(updated);
    saveStoredTrips(updated);
    showToast('Trip berhasil dihapus');
    if (selectedTripId === id || activeTrip?.id === id) {
      // Pilih trip di sebelahnya pada daftar yang sedang tampil (bukan selalu trip paling atas),
      // dan simpan pilihannya ke URL + penyimpanan lokal supaya refresh tidak kembali ke trip lain.
      const list = filteredTrips.length > 0 ? filteredTrips : trips;
      const idx = list.findIndex((t) => t.id === id);
      const neighbor = list[idx + 1] || list[idx - 1] || null;
      if (neighbor && neighbor.id !== id) {
        handleSelectTrip(neighbor.id, mobileTab);
      } else {
        setSelectedTripId(null);
        setMobileTab('list');
        try {
          localStorage.removeItem('cito_active_trip_id');
          const url = new URL(window.location.href);
          url.searchParams.delete('trip');
          window.history.replaceState({}, '', url.toString());
        } catch {}
      }
    }

    // Delete directly from Cloud Firestore in background
    setCloudStatus('syncing');
    deleteTripFromCloud(id)
      .then(() => {
        setCloudStatus('synced');
      })
      .catch((err) => {
        console.error('Failed to delete trip from cloud:', err);
        setCloudStatus('offline');
      });
  };

  const handleRequestDelete = (trip: Trip) => {
    setTripToDelete(trip);
    setIsDeleteModalOpen(true);
  };

  const handleRestoreDefaultTrips = () => {
    const defaults = resetToDefaultTrips();
    setTrips(defaults);
    setSelectedTripId(defaults[0]?.id || null);
    showToast('Contoh trip berhasil dimuat kembali');
  };

  const handleOpenAddModal = () => {
    setTripToEdit(null);
    setIsTripModalOpen(true);
  };

  const handleOpenEditModal = (trip: Trip) => {
    setTripToEdit(trip);
    setIsTripModalOpen(true);
  };

  const handleOpenItineraryModal = (trip: Trip) => {
    setItineraryTrip(trip);
    setIsItineraryModalOpen(true);
  };

  const handleUpdateTripItinerary = (newItinerary: string) => {
    if (!itineraryTrip) return;
    const updatedTrip = { ...itineraryTrip, itinerary: newItinerary, updated_at: Date.now() };
    handleSaveTrip(updatedTrip);
    setItineraryTrip(updatedTrip);
  };

  // Filter & Search
  const filteredTrips = trips.filter((t) => {
    // 1. Status Filter Khusus Admin (Semua, Dari Admin, Dari Tim, Draft, Final)
    if (tripStatusFilter === 'admin' && t.from_team) return false;
    if (tripStatusFilter === 'tim' && !t.from_team) return false;
    if (tripStatusFilter === 'draft' && !t.is_draft) return false;
    if (tripStatusFilter === 'final' && t.is_draft) return false;

    // 2. Filter Status Buka / Tutup
    const matchesFilter =
      filterStatus === 'Semua' ? true : t.status === filterStatus;

    // 3. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      t.nama_gunung.toLowerCase().includes(query) ||
      t.jalur.toLowerCase().includes(query) ||
      (t.ketinggian_mdpl && t.ketinggian_mdpl.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const adminTrips = trips.filter((t) => !t.from_team);
  const draftTrips = trips.filter((t) => t.is_draft);
  const teamDraftTrips = trips.filter((t) => t.is_draft && t.from_team);
  const teamTrips = trips.filter((t) => t.from_team);
  const finalTrips = trips.filter((t) => !t.is_draft);
  const activeTrip = trips.find((t) => t.id === selectedTripId) || filteredTrips[0] || null;

  const handleCopyTeamLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=tim`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link Form Tim berhasil disalin! Siap dikirimkan ke WhatsApp tim lapangan.');
      }).catch(() => {
        prompt('Salin link lembar input jadwal tim ini:', url);
      });
    } else {
      prompt('Salin link lembar input jadwal tim ini:', url);
    }
  };

  const handleCopyAdminKeyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?admin=${ADMIN_SECRET}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('🔑 Link Kunci Akses Mas Yuno berhasil disalin! Simpan di WhatsApp/Catatan pribadi Mas Yuno.');
      }).catch(() => {
        prompt('Salin link Kunci Akses Mas Yuno:', url);
      });
    } else {
      prompt('Salin link Kunci Akses Mas Yuno:', url);
    }
  };

  const handleLockToTeamMode = () => {
    if (confirm('Kunci perangkat ini kembali ke Mode Tim Lapangan? (Untuk membuka kembali, buka link rahasia Mas Yuno)')) {
      setMasYunoAuthenticated(false);
      setViewMode('tim');
      showToast('🔒 Perangkat ini telah dikunci ke Mode Tim Lapangan.');
    }
  };

  // URL mode listener and Secret Admin Key verification
  useEffect(() => {
    const evaluateAccess = () => {
      const params = new URLSearchParams(window.location.search);
      const kitId = params.get('kit') || params.get('mediakit');
      if (kitId) {
        setActiveMediaKitTripId(kitId);
      } else {
        setActiveMediaKitTripId(null);
      }

      if (params.get('mode') === 'tim' || window.location.hash === '#tim') {
        setViewMode('tim');
        return;
      }

      const hasSecret = checkAdminAccessInUrl(window.location.search, window.location.hash);
      if (hasSecret) {
        setMasYunoAuthenticated(true);
        setViewMode('admin');
        showToast('🔑 Akses Pemilik Mas Yuno Terverifikasi!');
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        } catch {
          // ignore
        }
        return;
      }

      // Periksa apakah perangkat ini sudah berstatus Mas Yuno
      const isAuth = isMasYunoAuthenticated();
      if (!isAuth) {
        // PERANGKAT TIM / PUBLIK: WAJIB TERKUNCI DI MODE TIM
        setViewMode('tim');
        return;
      }

      // Jika Mas Yuno telah terverifikasi:
      setViewMode('admin');
    };

    evaluateAccess();
    window.addEventListener('popstate', evaluateAccess);
    return () => window.removeEventListener('popstate', evaluateAccess);
  }, []);

  const handleCopyMediaKitLink = (trip: Trip) => {
    const url = getTripMediaKitUrl(trip, trips);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast(`🔗 Link Media Kit ${trip.nama_gunung} berhasil disalin! Siap dikirim ke WhatsApp tim.`);
      }).catch(() => {
        prompt(`Salin link Media Kit ${trip.nama_gunung}:`, url);
      });
    } else {
      prompt(`Salin link Media Kit ${trip.nama_gunung}:`, url);
    }
  };

  const handleOpenMediaKit = (trip: Trip) => {
    // In admin mode, open as a modal preview so admin doesn't leave the dashboard
    setPreviewMediaKitTrip(trip);
  };

  // Dedicated Media Kit View Route (When accessed via direct link ?kit=slug)
  if (activeMediaKitTripId) {
    const allTripsPool = trips.length > 0 ? trips : getStoredTrips();
    const targetTrip = findTripBySlugOrId(allTripsPool, activeMediaKitTripId);

    if (targetTrip) {
      return (
        <MediaKitView
          trip={targetTrip}
        />
      );
    } else if (trips.length === 0) {
      return (
        <div className="min-h-screen bg-[#0a0e14] flex flex-col items-center justify-center text-slate-300 p-6 space-y-4 text-center">
          <div className="w-10 h-10 border-3 border-[#e5a93c] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-white">Memuat Media Kit Trip Cito Adventure...</p>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-[#0a0e14] flex flex-col items-center justify-center text-slate-300 p-6 space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
            🏔️
          </div>
          <h2 className="text-xl font-extrabold text-white font-['Montserrat'] tracking-tight">Trip Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
            Media kit untuk rute <span className="text-[#e5a93c] font-bold font-mono">"{activeMediaKitTripId}"</span> tidak ditemukan atau telah diperbarui.
          </p>
        </div>
      );
    }
  }

  const handleSetViewMode = (mode: 'admin' | 'tim') => {
    setViewMode(mode);
    setMasYunoAuthenticated(mode === 'admin');
    showToast(mode === 'admin' ? '🔑 Beralih ke Mode Admin (Mas Yuno)' : '📋 Beralih ke Mode Tim Lapangan');
  };

  if (viewMode === 'tim') {
    return (
      <TeamInputView
        onTripSubmitted={(newTrip) => {
          setSelectedTripId(newTrip.id);
          setIsDraftBannerDismissed(false);
          showToast(`Draf jadwal ${newTrip.nama_gunung} berhasil dikirim ke Mas Yuno!`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#d1d1d1] text-[#1a2e16] flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-[#275d1d] selection:text-white">
      {/* Top App Navbar */}
      <Navbar
        onOpenAddModal={handleOpenAddModal}
        onOpenGithubGuide={() => setIsGithubGuideOpen(true)}
        tripCount={trips.length}
        draftCount={teamDraftTrips.length}
        onScrollToDrafts={() => {
          setIsDraftBannerDismissed(false);
          setTripStatusFilter('tim');
          if (teamDraftTrips.length > 0) {
            setSelectedTripId(teamDraftTrips[0].id);
            setMobileTab('detail');
          }
        }}
        adminDraftCount={trips.filter((t) => !t.from_team && t.is_draft).length}
        onScrollToAdminDrafts={() => {
          setTripStatusFilter('draft');
          const myDraft = trips.find((t) => !t.from_team && t.is_draft);
          if (myDraft) {
            setSelectedTripId(myDraft.id);
            setMobileTab('detail');
          }
        }}
        cloudStatus={cloudStatus}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onCopyTeamLink={handleCopyTeamLink}
        onCopyAdminKeyLink={handleCopyAdminKeyLink}
        onLockToTeamMode={handleLockToTeamMode}
        onOpenTeamMode={() => handleSetViewMode('tim')}
        onOpenTeamData={() => setIsTeamDataModalOpen(true)}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col">
        {/* Banner Kuota Cloud Harian */}
        {cloudStatus === 'quota_exceeded' && (
          <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-2">
                  <span>ℹ️ Kuota Baca Cloud Gratis Hari Ini Tercapai (Mode Cache Offline Aktif)</span>
                </div>
                <p className="text-[11px] text-amber-900 mt-0.5 max-w-2xl">
                  Aplikasi beroperasi mulus menggunakan penyimpanan lokal (IndexedDB & memori). Seluruh data trip, poster pamflet, dan caption tetap aman & berfungsi normal. Kuota Cloud harian akan reset otomatis besok.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCloudSyncOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Info Kuota & Database
            </button>
          </div>
        )}
        {/* Titik 2: Banner Notifikasi Cepat di Bagian Paling Atas Layar (Header Dashboard) Khusus Draf Tim */}
        {teamDraftTrips.length > 0 && !isDraftBannerDismissed && (
          <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-2 flex-wrap">
                  <span>📥 Ada {teamDraftTrips.length} Jadwal Baru Masuk dari Tim!</span>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full">
                    {teamDraftTrips[0].nama_gunung} ({teamDraftTrips[0].jalur})
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Disusun oleh <strong>{teamDraftTrips[0].draf_oleh || 'Tim CITO'}</strong>. Periksa rincian data lalu klik Setujui untuk membuat pamflet & caption.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedTripId(teamDraftTrips[0].id);
                  setMobileTab('detail');
                }}
                className="px-3.5 py-2 bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                Lihat & Review
              </button>
              <button
                onClick={() => {
                  const approved = {
                    ...teamDraftTrips[0],
                    is_draft: false,
                    from_team: teamDraftTrips[0].from_team === true,
                    updated_at: Date.now(),
                  };
                  handleSaveTrip(approved);
                  showToast(`Trip ${teamDraftTrips[0].nama_gunung} resmi disetujui & dipublikasikan!`);
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Setujui</span>
              </button>
              <button
                onClick={() => setIsDraftBannerDismissed(true)}
                className="p-1.5 text-amber-700 hover:text-amber-950 hover:bg-amber-200/50 rounded-lg cursor-pointer transition-colors"
                title="Sembunyikan banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation Pills */}
        <div className="flex md:hidden items-center justify-between gap-2 mb-4 bg-white p-1 rounded-lg border-2 border-[#275d1d]/30 shadow-xs">
          <button
            onClick={() => {
              setMobileTab('list');
            }}
            className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
              mobileTab === 'list'
                ? 'bg-[#275d1d] text-white shadow'
                : 'text-[#275d1d] hover:bg-[#e4e4e4]'
            }`}
          >
            Daftar Trip ({filteredTrips.length})
          </button>
          <button
            onClick={() => {
              if (activeTrip) {
                handleSelectTrip(activeTrip.id, 'detail');
              }
            }}
            disabled={!activeTrip}
            className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
              mobileTab === 'detail'
                ? 'bg-[#275d1d] text-white shadow'
                : 'text-[#275d1d] hover:bg-[#e4e4e4] disabled:opacity-40'
            }`}
          >
            Detail & Export
          </button>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 flex-1 items-start">
          {/* Left Column: Trip Directory & Filters */}
          <aside
            className={`md:col-span-5 lg:col-span-4 space-y-3.5 ${
              mobileTab === 'list' ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Search & Header Card matching Image 2 */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold font-['Montserrat'] tracking-tight text-[#275d1d]">
                  Daftar Trip
                </h2>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {filteredTrips.length} dari {trips.length}
                </span>
              </div>

              {/* Opsi Tombol Status Khusus Mode Admin (Semua, Dari Admin, Dari Tim, Draft Merah, Final) */}
              <div className="flex items-center gap-1.5 p-1 bg-[#f4f4f4] rounded-xl border border-[#275d1d]/20 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setTripStatusFilter('semua')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    tripStatusFilter === 'semua'
                      ? 'bg-[#275d1d] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  Semua ({trips.length})
                </button>

                <button
                  type="button"
                  onClick={() => setTripStatusFilter('admin')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    tripStatusFilter === 'admin'
                      ? 'bg-[#275d1d] text-white shadow-xs'
                      : 'text-[#275d1d] hover:text-[#1f4a17] hover:bg-slate-200/70'
                  }`}
                >
                  <span>👑 Admin</span>
                  {adminTrips.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        tripStatusFilter === 'admin'
                          ? 'bg-white/25 text-white'
                          : 'bg-[#275d1d] text-white'
                      }`}
                    >
                      {adminTrips.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTripStatusFilter('tim')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    tripStatusFilter === 'tim'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/70'
                  }`}
                >
                  <span>👥 Tim</span>
                  {teamTrips.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        tripStatusFilter === 'tim'
                          ? 'bg-white/25 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {teamTrips.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTripStatusFilter('draft')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    tripStatusFilter === 'draft'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-red-700 hover:text-red-900 hover:bg-red-100/70'
                  }`}
                >
                  <span>🔴 Draft</span>
                  {draftTrips.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        tripStatusFilter === 'draft'
                          ? 'bg-white/30 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {draftTrips.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTripStatusFilter('final')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    tripStatusFilter === 'final'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-800 hover:text-emerald-950 hover:bg-slate-200/70'
                  }`}
                >
                  <span>🟢 Final</span>
                  {finalTrips.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        tripStatusFilter === 'final'
                          ? 'bg-white/25 text-white'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {finalTrips.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#275d1d] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari gunung / jalur..."
                  className="w-full bg-[#f4f4f4] border border-[#275d1d]/30 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-[#1a2e16] placeholder-gray-500 focus:outline-none focus:border-[#275d1d]"
                />
              </div>
            </div>

            {/* Trip Cards List */}
            <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    isSelected={activeTrip?.id === trip.id}
                    onSelect={(t) => {
                      handleSelectTrip(t.id, 'detail');
                    }}
                  />
                ))
              ) : (
                <div className="bg-white border-2 border-dashed border-[#275d1d]/40 rounded-xl p-8 text-center space-y-3">
                  <Mountain className="w-10 h-10 text-[#275d1d]/60 mx-auto" />
                  <p className="text-xs text-gray-700 font-medium">
                    {trips.length === 0
                      ? 'Belum ada arsip trip. Anda bisa membuat trip baru atau memuat contoh.'
                      : 'Tidak ada trip yang sesuai pencarian.'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#275d1d] text-white text-xs font-bold hover:bg-[#1f4a17] transition-all cursor-pointer shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Trip Baru</span>
                    </button>
                    {trips.length === 0 && (
                      <button
                        onClick={handleRestoreDefaultTrips}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold border border-gray-300 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#275d1d]" />
                        <span>Muat Contoh Trip</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Column: Selected Trip Detail & Media Center */}
          <section
            className={`md:col-span-7 lg:col-span-8 ${
              mobileTab === 'detail' ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Mobile Back to List Button */}
            <div className="md:hidden mb-3">
              <button
                onClick={() => {
                  setMobileTab('list');
                  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'list');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#275d1d] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Trip</span>
              </button>
            </div>

            {activeTrip ? (
              <TripDetail
                trip={activeTrip}
                onEdit={handleOpenEditModal}
                onDelete={handleRequestDelete}
                onOpenItinerary={handleOpenItineraryModal}
                onShowToast={showToast}
                onSaveTrip={handleSaveTrip}
                onOpenMediaKit={handleOpenMediaKit}
                onCopyMediaKitLink={handleCopyMediaKitLink}
              />
            ) : (
              <div className="bg-white border-2 border-[#275d1d] rounded-xl p-12 text-center space-y-4 shadow-md">
                <Mountain className="w-14 h-14 text-[#275d1d]/50 mx-auto" />
                <h3 className="text-lg font-extrabold font-['Montserrat'] tracking-tight text-[#275d1d]">
                  {trips.length === 0 ? 'Belum Ada Jadwal Trip' : 'Pilih atau Tambahkan Trip'}
                </h3>
                <p className="text-xs text-gray-700 max-w-sm mx-auto leading-relaxed">
                  {trips.length === 0
                    ? 'Mulai buat arsip open trip atau private trip Anda untuk menghasilkan pamflet poster, itinerary, dan caption Instagram secara instan.'
                    : 'Pilih salah satu jadwal open trip di sebelah kiri untuk melihat detail, menyalin caption Instagram, atau mengekspor poster pamflet & itinerary.'}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Open Trip Pertama</span>
                  </button>
                  {trips.length === 0 && (
                    <button
                      onClick={handleRestoreDefaultTrips}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold border border-gray-300 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-[#275d1d]" />
                      <span>Muat Kembali Contoh Trip</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modals */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        onSave={handleSaveTrip}
        tripToEdit={tripToEdit}
      />

      <ItineraryModal
        isOpen={isItineraryModalOpen}
        onClose={() => setIsItineraryModalOpen(false)}
        trip={itineraryTrip}
        onUpdateTripItinerary={handleUpdateTripItinerary}
        onShowToast={showToast}
      />

      <GitHubGuideModal
        isOpen={isGithubGuideOpen}
        onClose={() => setIsGithubGuideOpen(false)}
        onShowToast={showToast}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        trip={tripToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTripToDelete(null);
        }}
        onConfirm={handleDeleteTrip}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        currentTrips={trips}
        onTripsUpdated={(updated) => {
          setTrips(updated);
          saveStoredTrips(updated);
          if (updated.length > 0) {
            setSelectedTripId(updated[0].id);
          }
          showToast(`Berhasil menyinkronkan ${updated.length} trip dari Cloud!`);
        }}
        cloudStatus={cloudStatus}
      />

      <TeamDataModal
        isOpen={isTeamDataModalOpen}
        onClose={() => setIsTeamDataModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Admin Media Kit Preview Modal */}
      {previewMediaKitTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex flex-col">
          <MediaKitView
            trip={previewMediaKitTrip}
            isPreviewModal={true}
            onClosePreview={() => setPreviewMediaKitTrip(null)}
          />
        </div>
      )}

      {/* Notifications & Offline Status */}
      <OfflineIndicator />
      <Toast message={toastMessage} />
    </div>
  );
}
