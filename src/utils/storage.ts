import { Trip } from '../types';
import { generateDefaultItinerary } from './formatters';
import { idbGet, idbSet, idbDelete } from './indexedDb';
import { saveLogoToCloud } from '../firebase';

const STORAGE_KEY = 'cito_adventure_trips_v3';
export const CUSTOM_LOGO_KEY = 'cito_custom_logo_v3';
export const OFFICIAL_LOGO_URL = '/logo.png?v=20260913_official_v4';
const INITIAL_SETUP_DONE_KEY = 'cito_adventure_init_done_v3';

// Automatically purge legacy custom logos so the official authentic logo (/logo.png) takes effect
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('cito_custom_logo_v1');
    localStorage.removeItem('cito_custom_logo_v2');
    localStorage.removeItem('cito_custom_brand_logo');
  } catch {
    // ignore
  }
  idbDelete('cito_custom_logo_v1');
  idbDelete('cito_custom_logo_v2');
  idbDelete('cito_custom_brand_logo');
}

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'sindoro-watu-lunyu',
    nama_gunung: 'Gunung Sindoro',
    ketinggian_mdpl: '3.153 MDPL',
    jalur: 'Via Watu Lunyu',
    status: 'Buka',
    tanggal_mulai: '2026-09-10',
    tanggal_selesai: '2026-09-11',
    durasi: '2 Hari 1 Malam',
    min_peserta: '15',
    max_peserta: '30',
    harga_mepo: [
      { lokasi: 'Jakarta', harga: 'IDR 950.000' },
      { lokasi: 'Solo', harga: 'IDR 750.000' },
      { lokasi: 'Madiun', harga: 'IDR 700.000' },
      { lokasi: 'Basecamp', harga: 'IDR 600.000' },
    ],
    include: [
      'Transportasi PP sesuai mepo',
      'Simaksi pendakian',
      'Ojek Basecamp - Pos 1',
      'Sarapan di basecamp',
      'Tenda kelompok',
      'Guide (bersertifikasi)',
      'Porter Tim',
      'Sweeper',
      'Makan selama pendakian',
      'Alat makan & masak',
      'P3K standard',
      'HT tim (alat komunikasi)',
      'Dokumentasi',
      'Bonus masuk YT Cito Adventure Madiun',
    ],
    exclude: [
      'Perlengkapan pribadi',
      'Surat sehat',
      'Obat-obatan pribadi khusus',
      'Logistik (camilan pribadi)',
      'Perlengkapan pendakian yang tidak ada di daftar',
      'Tip crew / guide / porter',
    ],
    extra_porter: 'Jika di perlukan',
    sk_berlaku: [
      'Peserta Untuk Umum (Sendiri Bisa Join)',
      'Apabila kuota tidak terpenuhi, akan ada biaya tambahan sesuai kesepakatan bersama',
      'DP minimal Rp 200.000',
      'Pelunasan Maksimal H-5',
      'Pembatalan Oleh Peserta: DP Hangus',
      'Trip Sesuai Jadwal (Diluar Jadwal Tersedia Private Trip)',
    ],
    catatan_penting:
      'SEBELUM MENDAKI, SANGAT DISARANKAN UNTUK RUTIN BEROLAHRAGA SEPERTI JOGGING, HIKING RINGAN, ATAU LATIHAN KARDIO MINIMAL 1-2 MINGGU SEBELUMNYA. MULAILAH DARI LATIHAN RINGAN, TINGKATKAN INTENSITASNYA, DAN PASTIKAN KONDISI TUBUH BENAR-BENAR SIAP.',
    itinerary: `🗓️ H-1 : Keberangkatan Meeting Point
• 19.00 - 20.30 : Kumpul peserta mepo Jakarta (Cawang) & briefing
• 21.00 - 04.00 : Perjalanan via tol menuju meeting point Solo & Madiun

🗓️ Hari 1 : Basecamp & Pendakian
• 06.00 - 07.30 : Tiba di Basecamp Watu Lunyu, registrasi & sarapan pagi
• 07.30 - 08.00 : Naik ojek Basecamp menuju Pos 1 & doa bersama
• 08.00 - 12.30 : Trekking santai Pos 1 - Pos 2 - Pos 3
• 12.30 - 13.30 : Makan siang & istirahat di area Pos 3
• 13.30 - 16.00 : Melanjutkan perjalanan ke camp area Pos 4 (Alang-Alang)
• 16.00 - 18.00 : Pasang tenda, coffee break & menikmati sunset
• 18.30 - 20.00 : Makan malam hangat bersama crew & istirahat tidur

🗓️ Hari 2 : Summit Attack & Kembali
• 02.30 - 03.00 : Bangun pagi, santap snack ringan & teh hangat
• 03.00 - 05.30 : Summit Attack menuju Puncak Sindoro 3.153 MDPL
• 05.30 - 07.30 : Menikmati golden sunrise, foto dokumentasi & kawah Sindoro
• 07.30 - 09.30 : Perjalanan turun kembali ke camp area Pos 4
• 09.30 - 11.00 : Sarapan pagi, packing perlengkapan & operasi semut sampah
• 11.00 - 14.00 : Turun ke Basecamp via Pos 1
• 14.00 - 16.00 : Bersih-bersih, istirahat & persiapan pulang
• 16.00 - selesai : Perjalanan pulang kembali ke meeting point masing-masing`,
    kontak_wa: '+6282230444428',
    kontak_ig: 'Cito Adventure Madiun',
    background_url: '/default-bg.jpg',
    background_overlay_dim: 0.15,
    created_at: Date.now() - 50000,
    updated_at: Date.now() - 50000,
  },
  {
    id: 'sumbing-butuh',
    nama_gunung: 'Gunung Sumbing',
    ketinggian_mdpl: '3.371 MDPL',
    jalur: 'Via Butuh (Nepal Van Java)',
    status: 'Buka',
    tanggal_mulai: '2026-09-17',
    tanggal_selesai: '2026-09-19',
    durasi: '3 Hari 2 Malam',
    min_peserta: '12',
    max_peserta: '25',
    harga_mepo: [
      { lokasi: 'Basecamp Butuh', harga: 'IDR 650.000' },
      { lokasi: 'Terminal Magelang', harga: 'IDR 750.000' },
      { lokasi: 'Stasiun Tugu Solo / Jogja', harga: 'IDR 850.000' },
      { lokasi: 'Madiun', harga: 'IDR 800.000' }
    ],
    include: [
      'Transportasi PP lokal sesuai mepo',
      'Tiket Simaksi resmi Taman Nasional',
      'Tenda & Matras camping',
      'Makan 5x selama pendakian di gunung',
      'Peralatan masak & gas',
      'Porter tenda & logistik bersama',
      'Guide ramah & berlisensi Cito Adventure',
      'P3K darurat & dokumentasi'
    ],
    exclude: [
      'Ojek Nepal van Java ke batas ladang (opsional)',
      'Sleeping bag & pakaian hangat pribadi',
      'Pengeluaran pribadi'
    ],
    extra_porter: 'Rp 350.000 / hari jika butuh porter beban pribadi',
    sk_berlaku: [
      'Peserta dinyatakan fix setelah membayar DP 50%',
      'Sehat jasmani dan rohani',
      'Patuhi kode etik pencinta alam dan arahan guide'
    ],
    catatan_penting: 'Jalur Butuh terkenal dengan keindahan pedesaan Nepal Van Java. Harap siapkan jas hujan dan pakaian ganti kedap air dalam plastik.',
    itinerary: generateDefaultItinerary('Gunung Sumbing', 'Via Butuh', '2026-09-17', '2026-09-19'),
    kontak_wa: '+6282230444428',
    kontak_ig: 'Cito Adventure Madiun',
    created_at: Date.now() - 200000,
    updated_at: Date.now() - 200000,
  },
  {
    id: 'merbabu-suwanting',
    nama_gunung: 'Gunung Merbabu',
    ketinggian_mdpl: '3.145 MDPL',
    jalur: 'Via Suwanting',
    status: 'Tutup',
    tanggal_mulai: '2026-08-20',
    tanggal_selesai: '2026-08-21',
    durasi: '2 Hari 1 Malam',
    min_peserta: '15',
    max_peserta: '25',
    harga_mepo: [
      { lokasi: 'Basecamp Suwanting', harga: 'IDR 550.000' },
      { lokasi: 'Stasiun Solo Balapan', harga: 'IDR 700.000' },
      { lokasi: 'Terminal Madiun', harga: 'IDR 650.000' }
    ],
    include: [
      'Simaksi & booking online Merbabu',
      'Transportasi PP mepo',
      'Tenda dome + matras',
      'Makan 3x',
      'Guide & Porter kelompok',
      'Dokumentasi'
    ],
    exclude: [
      'Sleeping bag & carrier',
      'Logistik snack pribadi'
    ],
    extra_porter: 'Rp 300.000 / hari',
    sk_berlaku: [
      'Pendaftaran ditutup H-7 atau jika kuota simaksi habis',
      'Wajib membawa identitas KTP/SIM asli'
    ],
    catatan_penting: 'Jalur Suwanting memiliki trek menanjak yang konstan dengan pemandangan sabana yang luar biasa.',
    itinerary: generateDefaultItinerary('Gunung Merbabu', 'Via Suwanting', '2026-08-20', '2026-08-21'),
    kontak_wa: '+6282230444428',
    kontak_ig: 'Cito Adventure Madiun',
    created_at: Date.now() - 300000,
    updated_at: Date.now() - 300000,
  }
];

// In-memory cache for ultra-fast synchronous access
let memoryCustomLogo: string | null = null;
let memoryTrips: Trip[] | null = null;

// Initialize memory cache from localStorage immediately
try {
  memoryCustomLogo = localStorage.getItem(CUSTOM_LOGO_KEY);
} catch {
  // localStorage may be unavailable/restricted
}

// Asynchronously load from IndexedDB (handles larger capacity without quota limits)
if (typeof window !== 'undefined') {
  idbGet<string>(CUSTOM_LOGO_KEY).then((idbLogo) => {
    if (idbLogo) {
      const changed = idbLogo !== memoryCustomLogo;
      memoryCustomLogo = idbLogo;
      if (changed) {
        window.dispatchEvent(new Event('cito_logo_updated'));
      }
    }
  });

  idbGet<Trip[]>(STORAGE_KEY).then((idbTrips) => {
    if (Array.isArray(idbTrips)) {
      memoryTrips = idbTrips;
    }
  });
}

export function getStoredTrips(): Trip[] {
  if (memoryTrips !== null) {
    return memoryTrips;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const isInitDone = localStorage.getItem(INITIAL_SETUP_DONE_KEY) === 'true';

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryTrips = parsed;
        return parsed;
      }
    }

    // If no trips in memory/localStorage, return empty array instead of populating 20+ dummy trips.
    // Cloud Firestore will deliver the real trips automatically.
    memoryTrips = [];
    return [];
  } catch {
    memoryTrips = [];
    return [];
  }
}

/**
 * Mengurutkan daftar trip sesuai Opsi A:
 * - Draf baru dari tim lapangan tetap dipin/ditaruh paling atas agar mudah ditinjau.
 * - Trip diurutkan berdasarkan tanggal jadwal keberangkatan (tanggal_mulai) dari yang terdekat.
 * - Jika tanggal sama, diurutkan berdasarkan waktu pembuatan terbaru.
 */
export function sortTripsByDepartureDate(trips: Trip[]): Trip[] {
  return [...trips].sort((a, b) => {
    // 1. Draf tim lapangan selalu di atas
    if (a.is_draft && !b.is_draft) return -1;
    if (!a.is_draft && b.is_draft) return 1;

    // 2. Berdasarkan tanggal jadwal keberangkatan (tanggal_mulai)
    const timeA = a.tanggal_mulai ? new Date(a.tanggal_mulai).getTime() : NaN;
    const timeB = b.tanggal_mulai ? new Date(b.tanggal_mulai).getTime() : NaN;

    const validA = !isNaN(timeA);
    const validB = !isNaN(timeB);

    if (validA && validB) {
      if (timeA !== timeB) {
        return timeA - timeB; // Tanggal keberangkatan terdekat / terbaru di awal
      }
    } else if (validA && !validB) {
      return -1;
    } else if (!validA && validB) {
      return 1;
    }

    // 3. Fallback jika tanggal sama: urutan waktu input terbaru
    return (b.created_at || 0) - (a.created_at || 0);
  });
}

export function saveStoredTrips(trips: Trip[]): void {
  memoryTrips = trips;
  try {
    localStorage.setItem(INITIAL_SETUP_DONE_KEY, 'true');
  } catch {
    // ignore quota
  }
  // Always persist to IndexedDB (virtually unlimited quota for rich trip data)
  idbSet(STORAGE_KEY, trips);

  // Also try to persist to localStorage for compatibility, handling quota safely
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.warn('localStorage quota reached for trips; securely saved in IndexedDB and memory instead.', err);
  }
}

export function clearAllDeletedTripIds(): void {
  try {
    localStorage.removeItem(DELETED_TRIPS_KEY);
  } catch {
    // ignore
  }
}

export function resetToDefaultTrips(): Trip[] {
  saveStoredTrips(INITIAL_TRIPS);
  return INITIAL_TRIPS;
}

const DELETED_TRIPS_KEY = 'cito_adventure_deleted_trips_v1';

export function getDeletedTripIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_TRIPS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function recordDeletedTripId(id: string): void {
  try {
    const set = getDeletedTripIds();
    set.add(id);
    const arr = Array.from(set).slice(-100);
    localStorage.setItem(DELETED_TRIPS_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function unrecordDeletedTripId(id: string): void {
  try {
    const set = getDeletedTripIds();
    set.delete(id);
    localStorage.setItem(DELETED_TRIPS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function getCustomLogo(): string | null {
  if (memoryCustomLogo) {
    return memoryCustomLogo;
  }
  try {
    const local = localStorage.getItem(CUSTOM_LOGO_KEY);
    if (local) {
      memoryCustomLogo = local;
      return local;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setCustomLogo(dataUrl: string): void {
  memoryCustomLogo = dataUrl;

  // Always save to IndexedDB (no 5MB quota constraint)
  idbSet(CUSTOM_LOGO_KEY, dataUrl);

  // Try to save to localStorage as a fallback, gracefully catching QuotaExceededError
  try {
    localStorage.setItem(CUSTOM_LOGO_KEY, dataUrl);
  } catch (err) {
    console.warn('localStorage quota reached for custom logo; securely stored in IndexedDB and memory instead.', err);
    try {
      localStorage.removeItem(CUSTOM_LOGO_KEY);
    } catch {
      // ignore
    }
  }

  // Notify components and pamphlets immediately
  window.dispatchEvent(new Event('cito_logo_updated'));

  // Also persist directly to server disk (/public/logo.png, etc.) so it never reverts on restart
  if (typeof window !== 'undefined') {
    fetch('/api/save-permanent-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    }).catch((err) => {
      console.warn('Could not write permanent logo to server disk:', err);
    });
  }

  // Sync to Cloud Firestore in background
  saveLogoToCloud(dataUrl).catch((err) => {
    console.warn('Could not sync logo to cloud:', err);
  });
}

export function clearCustomLogo(): void {
  memoryCustomLogo = null;
  idbDelete(CUSTOM_LOGO_KEY);
  try {
    localStorage.removeItem(CUSTOM_LOGO_KEY);
  } catch (err) {
    console.warn('Failed to clear custom logo from localStorage', err);
  }
  window.dispatchEvent(new Event('cito_logo_updated'));

  // Remove from Cloud Firestore in background
  saveLogoToCloud(null).catch((err) => {
    console.warn('Could not remove logo from cloud:', err);
  });
}

// ==========================================
// Admin Phone & Team Members Management
// ==========================================
export const ADMIN_PHONE_STORAGE_KEY = 'cito_admin_notification_phone_v1';
export const TEAM_MEMBERS_STORAGE_KEY = 'cito_team_members_v1';
export const DEFAULT_ADMIN_PHONE = '+6282230444428';

export const INITIAL_TEAM_MEMBERS: import('../types').TeamMember[] = [
  {
    id: 'tm-1',
    status: 'Guide',
    nama: 'Kang Yuno',
    no_wa: '+6282230444428',
    instagram: '@citoadventuremadiun',
    created_at: 1700000000000,
  },
  {
    id: 'tm-2',
    status: 'Guide / Admin Jakarta',
    nama: 'Admin Jakarta',
    no_wa: '+6289503689266',
    instagram: '@citoadventuremadiun',
    created_at: 1700000001000,
  },
  {
    id: 'tm-3',
    status: 'Porter',
    nama: 'Tim Porter Cito',
    no_wa: '+6282230444428',
    instagram: '@citoadventuremadiun',
    created_at: 1700000002000,
  },
  {
    id: 'tm-4',
    status: 'Kameramen',
    nama: 'Dokumentasi YT',
    no_wa: '+6282230444428',
    instagram: '@citoadventuremadiun',
    created_at: 1700000003000,
  },
];

export function getAdminPhone(): string {
  try {
    const saved = localStorage.getItem(ADMIN_PHONE_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_PHONE;
}

export function saveAdminPhone(phone: string): void {
  try {
    localStorage.setItem(ADMIN_PHONE_STORAGE_KEY, phone.trim());
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('cito_admin_phone_updated', { detail: phone.trim() }));
}

export function getTeamMembers(): import('../types').TeamMember[] {
  try {
    const saved = localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_TEAM_MEMBERS;
}

export function saveTeamMembers(members: import('../types').TeamMember[]): void {
  try {
    localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('cito_team_members_updated', { detail: members }));
}

export function syncCloudLogoToLocal(dataUrl: string | null): void {
  if (dataUrl) {
    memoryCustomLogo = dataUrl;
    idbSet(CUSTOM_LOGO_KEY, dataUrl);
    try {
      localStorage.setItem(CUSTOM_LOGO_KEY, dataUrl);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('cito_logo_updated'));
  } else {
    // Cloud has no custom logo overrides; reset to official default logo (/logo.png)
    if (memoryCustomLogo) {
      memoryCustomLogo = null;
      idbDelete(CUSTOM_LOGO_KEY);
      try {
        localStorage.removeItem(CUSTOM_LOGO_KEY);
      } catch {
        // ignore
      }
      window.dispatchEvent(new Event('cito_logo_updated'));
    }
  }
}

export const MAS_YUNO_AUTH_KEY = 'cito_mas_yuno_auth_v1';

export function isMasYunoAuthenticated(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    // Di lingkungan AI Studio Dev & Shared Preview (ais-dev-*.run.app, ais-pre-*.run.app, localhost), otomatis admin agar Mas Yuno nyaman
    const hostname = window.location.hostname;
    if (
      hostname.includes('ais-dev') ||
      hostname.includes('ais-pre') ||
      hostname.includes('run.app') ||
      hostname.includes('google') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    ) {
      return true;
    }
    // Di Vercel / domain custom publik: cek apakah sudah tersimpan autentikasi
    const authVal = localStorage.getItem(MAS_YUNO_AUTH_KEY);
    const modeVal = localStorage.getItem('cito_view_mode');
    return authVal === 'true' || modeVal === 'admin';
  } catch {
    return true;
  }
}

export function setMasYunoAuthenticated(status: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (status) {
      localStorage.setItem(MAS_YUNO_AUTH_KEY, 'true');
      localStorage.setItem('cito_view_mode', 'admin');
    } else {
      localStorage.removeItem(MAS_YUNO_AUTH_KEY);
      localStorage.setItem('cito_view_mode', 'tim');
    }
  } catch {
    // ignore
  }
}

export function checkAdminAccessInUrl(search: string, hash: string): boolean {
  try {
    const params = new URLSearchParams(search);
    const adminVal = (params.get('admin') || '').toLowerCase().trim();
    const kunciVal = (params.get('kunci') || '').toLowerCase().trim();
    
    // Support ?admin=yuno, ?admin=citoyuno, ?kunci=yuno, ?masyuno, ?yuno
    if (adminVal === 'yuno' || adminVal === 'citoyuno' || kunciVal === 'yuno') {
      return true;
    }
    if (params.has('masyuno') || params.has('yuno')) {
      return true;
    }
    const cleanHash = (hash || '').toLowerCase().trim();
    if (cleanHash === '#masyuno' || cleanHash === '#admin-yuno' || cleanHash === '#yuno') {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
