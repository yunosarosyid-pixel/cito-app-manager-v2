import { Trip, TripSchedule } from '../types';
import {
  generateDefaultStructuredDays,
  structuredToText,
} from './itineraryHelper';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getAllTripSchedules(trip: Trip): TripSchedule[] {
  const list: TripSchedule[] = [];
  if (trip.tanggal_mulai) {
    list.push({
      id: 'primary',
      tanggal_mulai: trip.tanggal_mulai,
      tanggal_selesai: trip.tanggal_selesai,
      durasi: trip.durasi,
      label: trip.jadwal_tambahan && trip.jadwal_tambahan.length > 0 ? 'Jadwal 1' : '',
    });
  }
  if (Array.isArray(trip.jadwal_tambahan)) {
    trip.jadwal_tambahan.forEach((j, idx) => {
      if (j && j.tanggal_mulai) {
        let label = j.label || `Jadwal ${idx + 2}`;
        if (label.startsWith('Gelombang') || label.startsWith('Batch')) {
          label = label.replace(/Gelombang|Batch/gi, 'Jadwal').trim();
        }
        list.push({
          id: j.id || `extra-${idx}`,
          tanggal_mulai: j.tanggal_mulai,
          tanggal_selesai: j.tanggal_selesai,
          durasi: j.durasi || calculateDuration(j.tanggal_mulai, j.tanggal_selesai),
          label: label,
        });
      }
    });
  }
  return list;
}

export function formatTripAllDates(trip: Trip): string {
  const schedules = getAllTripSchedules(trip);
  if (schedules.length === 0) return 'Jadwal Terbuka';
  if (schedules.length === 1) {
    return formatDateRange(schedules[0].tanggal_mulai, schedules[0].tanggal_selesai);
  }
  return schedules
    .map((s, idx) => `${s.label || `Batch ${idx + 1}`}: ${formatDateRange(s.tanggal_mulai, s.tanggal_selesai)}`)
    .join('  |  ');
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return dateStr;
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];
  return `${day} ${MONTH_NAMES_ID[month] || ''} ${year}`;
}

export function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr && !endDateStr) return '';
  if (startDateStr && !endDateStr) return formatDateID(startDateStr);
  if (!startDateStr && endDateStr) return formatDateID(endDateStr);
  if (startDateStr === endDateStr) return formatDateID(startDateStr);

  const startParts = startDateStr.split('-').map(Number);
  const endParts = endDateStr.split('-').map(Number);

  const sYear = startParts[0];
  const sMonth = startParts[1] - 1;
  const sDay = startParts[2];

  const eYear = endParts[0];
  const eMonth = endParts[1] - 1;
  const eDay = endParts[2];

  // Same month & year: "10 – 11 September 2026"
  if (sYear === eYear && sMonth === eMonth) {
    return `${sDay} – ${eDay} ${MONTH_NAMES_ID[sMonth]} ${sYear}`;
  }

  // Same year, different month: "30 September – 2 Oktober 2026"
  if (sYear === eYear) {
    return `${sDay} ${MONTH_NAMES_ID[sMonth]} – ${eDay} ${MONTH_NAMES_ID[eMonth]} ${sYear}`;
  }

  // Different year
  return `${sDay} ${MONTH_NAMES_ID[sMonth]} ${sYear} – ${eDay} ${MONTH_NAMES_ID[eMonth]} ${eYear}`;
}

export function calculateDuration(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return '2 Hari 1 Malam';

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Tanggal tidak valid';
  if (diffDays === 0) return '1 Hari (Tektok)';
  
  const totalDays = diffDays + 1;
  const totalNights = diffDays;
  return `${totalDays} Hari ${totalNights} Malam`;
}

/**
 * Menghitung tanggal selesai otomatis ketika tanggal mulai dipilih/diubah.
 * - Jika currentEndDate kosong, atau lebih kecil/sama dengan startDate, atau berbeda bulan jauh:
 *   otomatis set ke H+1 (durasi standar 2 Hari 1 Malam) di bulan yang sama.
 * - Jika sudah ada durasi hari yang valid (misal H+1, H+2), pertahankan selisih hari tersebut
 *   sehingga tanggal selesai otomatis bergeser ke bulan dan tanggal yang tepat tanpa perlu scroll.
 */
export function computeAutoEndDate(startDateStr: string, currentEndDateStr?: string): string {
  if (!startDateStr) return currentEndDateStr || '';

  const startParts = startDateStr.split('-').map(Number);
  if (startParts.length !== 3 || isNaN(startParts[0])) return currentEndDateStr || '';

  const [sYear, sMonth, sDay] = startParts;
  const startDate = new Date(sYear, sMonth - 1, sDay);

  let dayOffset = 1; // Default H+1 (2 Hari 1 Malam)

  if (currentEndDateStr) {
    const endParts = currentEndDateStr.split('-').map(Number);
    if (endParts.length === 3 && !isNaN(endParts[0])) {
      const [eYear, eMonth, eDay] = endParts;
      const currentEndDate = new Date(eYear, eMonth - 1, eDay);
      const diffDays = Math.round((currentEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Jika selisih hari valid dan realistis untuk open trip (1 sampai 7 hari), pertahankan durasinya!
      if (diffDays >= 1 && diffDays <= 7) {
        dayOffset = diffDays;
      }
    }
  }

  const targetDate = new Date(sYear, sMonth - 1, sDay + dayOffset);
  const targetYear = targetDate.getFullYear();
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const targetDay = String(targetDate.getDate()).padStart(2, '0');

  return `${targetYear}-${targetMonth}-${targetDay}`;
}

export function generateDefaultItinerary(
  mountainName: string,
  jalur: string,
  startDateStr: string,
  endDateStr: string
): string {
  const cleanMtn = mountainName || 'Gunung';
  const cleanJalur = jalur || 'Basecamp';
  const title = `🗓️ ITINERARY PENDAKIAN ${cleanMtn.toUpperCase()} ${cleanJalur.toUpperCase()}`;
  const days = generateDefaultStructuredDays(mountainName, jalur, startDateStr, endDateStr);
  return structuredToText(days, title);
}

export function generateMountainHashtags(mountainName: string, height: string): string[] {
  // Convert "Gunung Sindoro" -> "gunungsindoro"
  const mtnSlug = mountainName.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Height digits only: "3.153 MDPL" -> "3153mdpl"
  const heightDigits = height.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const tags: string[] = [];
  if (mtnSlug) {
    tags.push(`#${mtnSlug}`);
    if (heightDigits) {
      tags.push(`#${mtnSlug}${heightDigits}`);
    }
  }
  return tags;
}

export type HookStyle =
  | 'open_trip_resmi'
  | 'yuk_gasss'
  | 'solidaritas'
  | 'samudra_awan'
  | 'recharge'
  | 'kuota_terbatas'
  | 'custom';

export interface HookOptionItem {
  id: HookStyle;
  label: string;
  hookTitle: string;
  introTemplate: string;
}

export interface CaptionCustomOptions {
  hookStyle?: HookStyle;
  customHookTitle?: string;
  customHookIntro?: string;
  customWaGreeting?: string;
  customWaIntro?: string;
  includeMepo?: boolean;
  includeFacilities?: boolean;
  includeExclude?: boolean;
  includeSK?: boolean;
  includeItinerary?: boolean;
}

export const HOOK_OPTIONS: HookOptionItem[] = [
  {
    id: 'open_trip_resmi',
    label: '🏔️ Resmi: "Open Trip Cito Adventure Madiun"',
    hookTitle: 'OPEN TRIP {gunung} BERSAMA CITO ADVENTURE MADIUN 🏔️✨',
    introTemplate:
      'Siapkan ranselmu untuk petualangan seru ke puncak {gunung} {ketinggian} via {jalur}! Bersama Cito Adventure, nikmati perjalanan nyaman, seru, dan penuh kenangan tak terlupakan. ⛺🌿',
  },
  {
    id: 'yuk_gasss',
    label: '🔥 Semangat: "Yuk Gasss!"',
    hookTitle: 'YUK GASSS! SAMUDRA DI ATAS AWAN BERSAMA CITO ADVENTURE 🏔️✨',
    introTemplate:
      'Saatnya agendakan langkah kakimu menuju puncak {gunung} {ketinggian} via {jalur}! Ajak bestie kamu atau solo hiking tetap seru, karena bareng Cito Adventure kita berangkat teman, pulang jadi keluarga! 🙌⛺',
  },
  {
    id: 'solidaritas',
    label: '🤝 Solidaritas: "Teman Jadi Keluarga"',
    hookTitle: 'BERANGKAT SEBAGAI TEMAN, PULANG SEBAGAI KELUARGA 🤝🏔️',
    introTemplate:
      'Mau nanjak tapi gak ada temen? Tenang, langsung join Open Trip {gunung} {ketinggian} via {jalur} bareng Cito Adventure! Di sini kita saling jaga, berbagi tawa, dan nikmati indahnya puncak bersama. 🙌⛺',
  },
  {
    id: 'samudra_awan',
    label: '☁️ Syahdu: "Panggilan Jiwa Petualang"',
    hookTitle: 'PANGGILAN JIWA PETUALANG! SAATNYA MELANGKAH KE PUNCAK TERTINGGI 🏔️🌿',
    introTemplate:
      'Langit biru, hamparan kabut putih, dan hangatnya secangkir kopi di atas awan sudah menunggumu di {gunung} {ketinggian} via {jalur}. Saatnya rehat sejenak dan biarkan alam menyembuhkan lelahmu. ☁️☕',
  },
  {
    id: 'recharge',
    label: '🔋 Healing: "Recharge Energi Kota"',
    hookTitle: 'BOSAN DENGAN RUTINITAS KOTA? SAATNYA RECHARGE ENERGI BERSAMA KAMI! 🏕️🌅',
    introTemplate:
      'Tinggalkan kepenatan kerja dan rutinitas kota sejenak! Hirup udara segar pegunungan di {gunung} {ketinggian} via {jalur}. Bersama tim solid Cito Adventure, liburanmu dijamin aman, nyaman & berkesan. 🌲✨',
  },
  {
    id: 'kuota_terbatas',
    label: '⚡ Urgency: "Seat Kuota Terbatas"',
    hookTitle: 'OPEN TRIP RESMI DIBUKA! KUOTA TERBATAS, SIAPA CEPAT DIA DAPAT! 🚀⛺',
    introTemplate:
      'Slot terbatas jangan sampai kehabisan! Open Trip resmi {gunung} {ketinggian} via {jalur} sudah dibuka. Siapkan fisik & ranselmu, amankan kursimu sekarang sebelum kuota full booked! 🚀⛺',
  },
  {
    id: 'custom',
    label: '✍️ Kustom Gaya Saya Sendiri',
    hookTitle: 'OPEN TRIP {gunung} BERSAMA CITO ADVENTURE MADIUN 🏔️✨',
    introTemplate:
      'Siapkan ranselmu untuk petualangan seru ke puncak {gunung} {ketinggian} via {jalur}! Bersama Cito Adventure, nikmati perjalanan nyaman, seru, dan penuh kenangan tak terlupakan. ⛺🌿',
  },
];

/**
 * Replace placeholders like {gunung}, {jalur}, {ketinggian}, {tanggal}
 */
export function replaceCaptionPlaceholders(template: string, trip: Trip): string {
  if (!template) return '';
  const mtnUpper = (trip.nama_gunung || 'GUNUNG').toUpperCase();
  const heightUpper = (trip.ketinggian_mdpl || '').toUpperCase();
  const jalurUpper = (trip.jalur || 'VIA BASECAMP').toUpperCase();
  const dateRangeStr = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai) || 'Jadwal Terbuka';
  const durasiStr = trip.durasi || '2 Hari 1 Malam';

  return template
    .replace(/\{gunung\}/gi, mtnUpper)
    .replace(/\{ketinggian\}/gi, heightUpper)
    .replace(/\{jalur\}/gi, jalurUpper)
    .replace(/\{tanggal\}/gi, dateRangeStr)
    .replace(/\{durasi\}/gi, durasiStr);
}

/**
 * Format individual mepo price cleanly (handles numeric e.g. 700000 or custom text e.g. Menyesuaikan jumlah peserta)
 */
export function formatMepoPriceItem(lokasi: string, harga: string): string {
  const raw = (harga || '').trim();
  if (!raw) return 'IDR Hubungi Admin /pax';

  // Already has /pax or /pak
  if (/\/(pax|pak|orang)/i.test(raw)) {
    return raw.toUpperCase().startsWith('IDR') ? raw : `IDR ${raw}`;
  }

  // Pure text like "Menyesuaikan jumlah peserta" or "(Menyesuaikan jumlah peserta)"
  const isLettersOnly = /[a-zA-Z]/.test(raw) && !/^\s*(\d{1,3}[.,]?)+$/.test(raw) && !raw.toUpperCase().startsWith('IDR');
  if (isLettersOnly) {
    const cleanText = raw.replace(/^[(\s]+|[)\s]+$/g, '');
    return `IDR (${cleanText}) /pax`;
  }

  // Starts with IDR and contains text
  if (raw.toUpperCase().startsWith('IDR')) {
    return `${raw} /pax`;
  }

  // Pure digits or formatted digits
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits) {
    return `IDR ${Number(digits).toLocaleString('id-ID')} /pax`;
  }

  return `IDR ${raw} /pax`;
}

/**
 * Mendapatkan harga patokan Basecamp (diutamakan mencari MEPO Basecamp)
 */
export function getBasecampStartPrice(trip: Trip): string {
  if (!trip.harga_mepo || trip.harga_mepo.length === 0) {
    return 'IDR 600.000';
  }

  // 1. Cari yang bernama Basecamp / BC
  const bcItem = trip.harga_mepo.find(
    (m) => m.lokasi.toLowerCase().includes('basecamp') || m.lokasi.toLowerCase().includes('bc ') || m.lokasi.toLowerCase() === 'bc'
  );
  if (bcItem && bcItem.harga && bcItem.harga.trim()) {
    return bcItem.harga.trim();
  }

  // 2. Fallback: Cari harga angka terendah
  let lowestNum = Infinity;
  let lowestRaw = '';
  for (const m of trip.harga_mepo) {
    const digits = (m.harga || '').replace(/[^0-9]/g, '');
    if (digits) {
      const val = parseInt(digits, 10);
      if (val > 0 && val < lowestNum) {
        lowestNum = val;
        lowestRaw = m.harga.trim();
      }
    }
  }

  if (lowestRaw) return lowestRaw;
  return trip.harga_mepo[0]?.harga || 'IDR 600.000';
}

/**
 * Groups and sorts MEPO into:
 * 1. Jakarta on top with *(Min X Pax)
 * 2. Basecamp and other intermediate cities in middle
 * 3. Madiun on bottom with *(Min Y Pax)
 */
export function formatMepoCaptionSection(trip: Trip, indent: string = ''): string[] {
  if (!trip.harga_mepo || trip.harga_mepo.length === 0) return [];

  const minMadiun = trip.min_peserta || '7';
  const minJakarta = trip.min_peserta_jakarta || '10';

  const jakartaMepos = trip.harga_mepo.filter((m) =>
    (m.lokasi || '').toLowerCase().includes('jakarta')
  );
  const madiunMepos = trip.harga_mepo.filter((m) =>
    (m.lokasi || '').toLowerCase().includes('madiun')
  );
  const middleMepos = trip.harga_mepo.filter(
    (m) =>
      !(m.lokasi || '').toLowerCase().includes('jakarta') &&
      !(m.lokasi || '').toLowerCase().includes('madiun')
  );

  const lines: string[] = [];

  // 1. Jakarta di paling atas + *(Min 10 Pax)
  if (jakartaMepos.length > 0) {
    jakartaMepos.forEach((m) => {
      lines.push(`${indent}• ${m.lokasi} : ${formatMepoPriceItem(m.lokasi, m.harga)}`);
    });
    lines.push(`${indent}  *(Min ${minJakarta} Pax)`);
  }

  // 2. Basecamp & Kota-kota lain di tengah (bebas)
  if (middleMepos.length > 0) {
    middleMepos.forEach((m) => {
      lines.push(`${indent}• ${m.lokasi} : ${formatMepoPriceItem(m.lokasi, m.harga)}`);
    });
  }

  // 3. Madiun di paling bawah + *(Min 7 Pax)
  if (madiunMepos.length > 0) {
    madiunMepos.forEach((m) => {
      lines.push(`${indent}• ${m.lokasi} : ${formatMepoPriceItem(m.lokasi, m.harga)}`);
    });
    lines.push(`${indent}  *(Min ${minMadiun} Pax)`);
  } else if (middleMepos.length > 0 && jakartaMepos.length > 0) {
    // Jika tidak ada madiun eksplisit tapi ada mepo daerah lain, pasang min kuota daerah di akhir
    lines.push(`${indent}  *(Min ${minMadiun} Pax)`);
  }

  return lines;
}

export function generateInstagramFeedCaption(
  trip: Trip,
  options: CaptionCustomOptions = {}
): string {
  const {
    hookStyle = 'open_trip_resmi',
    customHookTitle,
    customHookIntro,
    includeMepo = true,
    includeFacilities = true,
    includeExclude = true,
    includeSK = true,
    includeItinerary = false,
  } = options;

  const mtnUpper = (trip.nama_gunung || 'GUNUNG').toUpperCase();
  const heightUpper = (trip.ketinggian_mdpl || '').toUpperCase();
  const jalurUpper = (trip.jalur || 'VIA BASECAMP').toUpperCase();
  const dateRangeStr = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai) || 'Jadwal Terbuka';
  const durasiStr = trip.durasi || '2 Hari 1 Malam';

  const defaultHookItem = HOOK_OPTIONS.find((h) => h.id === hookStyle) || HOOK_OPTIONS[0];

  // Resolve Hook Title (custom or preset)
  const resolvedHookTitle = customHookTitle !== undefined && customHookTitle.trim() !== ''
    ? replaceCaptionPlaceholders(customHookTitle, trip)
    : replaceCaptionPlaceholders(defaultHookItem.hookTitle, trip);

  // Resolve Hook Intro (custom or preset)
  const resolvedHookIntro = customHookIntro !== undefined && customHookIntro.trim() !== ''
    ? replaceCaptionPlaceholders(customHookIntro, trip)
    : replaceCaptionPlaceholders(defaultHookItem.introTemplate, trip);

  const minMadiun = trip.min_peserta || '7';
  const maxTotal = trip.max_peserta || '20';
  const pesertaStr = `${minMadiun} / ${maxTotal} Pax`;

  const lines: string[] = [];

  // 1. Hook & Intro
  if (resolvedHookTitle.trim()) {
    lines.push(resolvedHookTitle.trim());
    lines.push('');
  }
  if (resolvedHookIntro.trim()) {
    lines.push(resolvedHookIntro.trim());
    lines.push('');
  }

  // 2. Info Inti
  lines.push('📌 DETAIL INFORMASI TRIP:');
  lines.push(`🏔️ Gunung: ${mtnUpper}${heightUpper ? ` ${heightUpper}` : ''}`);
  lines.push(`📍 Jalur: ${jalurUpper}`);

  const allSchedules = getAllTripSchedules(trip);
  if (allSchedules.length > 1) {
    lines.push('🗓️ Jadwal trip:');
    allSchedules.forEach((sch) => {
      const schRange = formatDateRange(sch.tanggal_mulai, sch.tanggal_selesai);
      lines.push(`  • ${schRange}`);
    });
  } else {
    lines.push(`🗓️ Jadwal trip:\n  • ${dateRangeStr}`);
  }
  lines.push(`👥 Kuota: ${pesertaStr}`);

  // 3. Tarif Meeting Point
  if (includeMepo && trip.harga_mepo && trip.harga_mepo.length > 0) {
    lines.push('');
    lines.push('💰 TARIF PER MEETING POINT (MEPO):');
    const mepoLines = formatMepoCaptionSection(trip, '');
    lines.push(...mepoLines);
  }

  // 4. Fasilitas Unggulan Include
  if (includeFacilities) {
    lines.push('');
    lines.push('✨ FASILITAS INCLUDE LENGKAP:');
    const incList = trip.include && trip.include.length > 0 ? trip.include : [
      'Transportasi PP sesuai mepo',
      'Simaksi pendakian resmi',
      'Sarapan di basecamp',
      'Ojek Basecamp - Pos 1',
      'Tenda kelompok',
      'Tim Guide (pemandu bersertifikasi, porter & sweeper)',
      'Makan selama pendakian',
      'Alat makan & masak',
      'P3K standard & HT tim',
      'Dokumentasi foto & video',
      'Bonus tayang YouTube Cito Adventure Madiun',
    ];
    incList.forEach((item) => {
      lines.push(`  ✓ ${item}`);
    });
  }

  // 4b. Fasilitas Exclude (Tidak Termasuk)
  if (includeExclude && trip.exclude && trip.exclude.length > 0) {
    lines.push('');
    lines.push('❌ FASILITAS EXCLUDE (TIDAK TERMASUK):');
    trip.exclude.forEach((item) => {
      lines.push(`  ✕ ${item}`);
    });
    if (trip.extra_porter && trip.extra_porter.trim()) {
      lines.push(`  🎒 Extra Porter: ${trip.extra_porter.trim()}`);
    }
  }

  // 5. Rundown Singkat jika diaktifkan
  if (includeItinerary && trip.itinerary) {
    lines.push('');
    lines.push('🗓️ RUNDOWN ITINERARY:');
    lines.push(trip.itinerary);
  }

  // 6. Syarat & Ketentuan (S&K)
  if (includeSK) {
    lines.push('');
    lines.push('⚠️ SYARAT & KETENTUAN (S&K):');
    const skList = trip.sk_berlaku && trip.sk_berlaku.length > 0
      ? trip.sk_berlaku
      : [
          'DP minimal Rp 200.000 / pax untuk amankan seat kamu',
          'Pelunasan biaya trip maksimal H-5 keberangkatan',
          'Peserta umum (sendiri tetap bisa gabung rombongan)',
        ];
    skList.forEach((sk) => {
      lines.push(`  • ${sk}`);
    });
  }

  // 7. Call To Action & Kontak
  const waJatim = trip.kontak_wa_jatim || '+6282230444428';
  const waJakarta = trip.kontak_wa_jakarta || '+6289503689266';

  lines.push('');
  lines.push('📲 INFORMASI & PENDAFTARAN RESMI:');
  lines.push(`• Admin Jatim & Jateng: ${waJatim}`);
  lines.push(`• Admin Jakarta: ${waJakarta}`);
  lines.push(`📸 Instagram: ${trip.kontak_ig || '@citoadventuremadiun'}`);
  lines.push('');

  // 8. Dynamic Hashtags
  const mtnTags = generateMountainHashtags(trip.nama_gunung, trip.ketinggian_mdpl);
  const mtnTagString = mtnTags.length > 0 ? ` ${mtnTags.join(' ')}` : '';
  lines.push(
    `#citoadventure #citoadventuremadiun #opentrip #opentripindonesia #pendakiindonesia #exploregunung #madiunhits #indomountain${mtnTagString}`
  );

  return lines.join('\n');
}

export function generateWhatsAppBroadcastCaption(
  trip: Trip,
  options: CaptionCustomOptions = {}
): string {
  const {
    customWaGreeting,
    customWaIntro,
    includeMepo = true,
    includeFacilities = true,
    includeExclude = true,
    includeSK = true,
  } = options;

  const mtnUpper = (trip.nama_gunung || 'GUNUNG').toUpperCase();
  const heightUpper = (trip.ketinggian_mdpl || '').toUpperCase();
  const jalurUpper = (trip.jalur || 'VIA BASECAMP').toUpperCase();
  const allSchedules = getAllTripSchedules(trip);
  const dateRangeStr = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai) || 'Jadwal Terbuka';
  
  const waJatim = trip.kontak_wa_jatim || '+6282230444428';
  const waJakarta = trip.kontak_wa_jakarta || '+6289503689266';
  const waJatimClean = waJatim.replace(/[^0-9]/g, '');
  const waJakartaClean = waJakarta.replace(/[^0-9]/g, '');

  const lines: string[] = [];

  const greeting = customWaGreeting !== undefined && customWaGreeting.trim() !== ''
    ? replaceCaptionPlaceholders(customWaGreeting, trip)
    : `Halo Sobat Petualang Cito Adventure! 🌿👋`;

  const intro = customWaIntro !== undefined && customWaIntro.trim() !== ''
    ? replaceCaptionPlaceholders(customWaIntro, trip)
    : `Open Trip *${mtnUpper} ${heightUpper}* via *${jalurUpper}* resmi dibuka kuotanya! Siap-siap nikmati pemandangan sunrise dan lautan awan terbaik.`;

  if (greeting.trim()) {
    lines.push(greeting.trim());
    lines.push('');
  }
  if (intro.trim()) {
    lines.push(intro.trim());
    lines.push('');
  }
  if (allSchedules.length > 1) {
    lines.push(`📅 *Jadwal trip:*`);
    allSchedules.forEach((sch) => {
      const schRange = formatDateRange(sch.tanggal_mulai, sch.tanggal_selesai);
      lines.push(`• ${schRange}`);
    });
  } else {
    lines.push(`📅 *Jadwal:* ${dateRangeStr}`);
  }
  const minMadiun = trip.min_peserta || '7';
  const maxTotal = trip.max_peserta || '20';
  const kuotaStr = `${minMadiun} / ${maxTotal} Pax`;
  lines.push(`👥 *Kuota Peserta:* ${kuotaStr} (Sendiri bisa langsung join)`);

  if (includeMepo && trip.harga_mepo && trip.harga_mepo.length > 0) {
    lines.push('');
    lines.push(`💰 *TARIF PER MEETING POINT (MEPO):*`);
    const mepoLines = formatMepoCaptionSection(trip, '');
    lines.push(...mepoLines);
  }

  if (includeFacilities) {
    lines.push('');
    lines.push(`✅ *Fasilitas Include Lengkap:*`);
    const incList = trip.include && trip.include.length > 0 ? trip.include : [
      'Transportasi PP & Simaksi Resmi',
      'Ojek Basecamp - Pos 1 & Sarapan BC',
      'Tenda Kelompok, Alat Masak & Makan di Gunung',
      'Guide Bersertifikasi, Porter, Sweeper & HT Tim',
      'Dokumentasi Foto/Video & Tayang YouTube Cito Adventure',
    ];
    incList.forEach((item) => {
      lines.push(`• ${item}`);
    });
  }

  if (includeExclude && trip.exclude && trip.exclude.length > 0) {
    lines.push('');
    lines.push(`❌ *Exclude (Tidak Termasuk):*`);
    trip.exclude.forEach((item) => {
      lines.push(`• ${item}`);
    });
    if (trip.extra_porter && trip.extra_porter.trim()) {
      lines.push(`🎒 *Extra Porter:* ${trip.extra_porter.trim()}`);
    }
  }

  if (includeSK) {
    lines.push('');
    lines.push(`📌 *Syarat Pendaftaran (S&K):*`);
    const skList = trip.sk_berlaku && trip.sk_berlaku.length > 0
      ? trip.sk_berlaku
      : [
          'DP cukup Rp 200.000 untuk kunci seat',
          'Pelunasan maksimal H-5 sebelum berangkat',
        ];
    skList.forEach((sk) => {
      lines.push(`- ${sk}`);
    });
  }

  // Generate dynamic WA links for both admins
  const prefillText = encodeURIComponent(
    `Halo Admin Cito Adventure, saya mau tanya/daftar Open Trip ${mtnUpper} (${dateRangeStr}). Apakah masih ada slot?`
  );
  const waLinkJatim = `https://wa.me/${waJatimClean}?text=${prefillText}`;
  const waLinkJakarta = `https://wa.me/${waJakartaClean}?text=${prefillText}`;

  lines.push('');
  lines.push(`Yuk amankan slot kamu sebelum penuh!`);
  lines.push(`👉 *Pendaftaran & Tanya Info via WhatsApp:*`);
  lines.push(`• *Admin Jatim & Jateng (${waJatim}):*`);
  lines.push(`  ${waLinkJatim}`);
  lines.push(`• *Admin Jakarta & Sekitarnya (${waJakarta}):*`);
  lines.push(`  ${waLinkJakarta}`);
  lines.push('');
  lines.push(`Salam Lestari,`);
  lines.push(`*Cito Adventure Madiun*`);

  return lines.join('\n');
}

export function generateStoryQuickCaption(trip: Trip): string {
  const mtnUpper = (trip.nama_gunung || 'GUNUNG').toUpperCase();
  const dateRangeStr = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai) || 'Jadwal Terbuka';
  const startPrice = getBasecampStartPrice(trip);
  const waJatim = trip.kontak_wa_jatim || '+6282230444428';
  const waJakarta = trip.kontak_wa_jakarta || '+6289503689266';

  return `🔥 OPEN TRIP ${mtnUpper} 🔥
🗓️ ${dateRangeStr}
💰 Start from ${startPrice}
⛺ Fasilitas Full Include (Tenda, Makan, Guide & Dokumentasi)
👥 Sendiri bisa langsung join!

📲 Info & Booking WhatsApp:
• Admin Jatim/Jateng: ${waJatim}
• Admin Jakarta: ${waJakarta}
📸 IG: @citoadventuremadiun`;
}

export function generateInstagramCaption(trip: Trip): string {
  // Backward compatibility alias to the rich feed generator
  return generateInstagramFeedCaption(trip);
}
