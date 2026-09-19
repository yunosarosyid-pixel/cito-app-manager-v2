import { Trip } from '../types';

/**
 * Membuat slug ramah manusia dari Nama Gunung dan Jalur
 * Contoh: "Gunung Sindoro" + "Via Watu Lunyu" => "sindoro-watu-lunyu"
 */
export function createTripSlug(trip: Trip): string {
  if (!trip) return '';

  // Bersihkan kata awalan umum seperti "Gunung", "Gn.", "G."
  let mountain = (trip.nama_gunung || '')
    .toLowerCase()
    .replace(/^(gunung|gn\.|gn|g\.)\s+/i, '')
    .trim();

  // Bersihkan kata awalan jalur seperti "Via"
  let route = (trip.jalur || '')
    .toLowerCase()
    .replace(/^via\s+/i, '')
    .trim();

  // Jika jalur berupa default seperti "jalur resmi", abaikan agar slug tetap ringkas
  if (route.includes('jalur resmi') || route.includes('default') || route === '-') {
    route = '';
  }

  const combined = route ? `${mountain} ${route}` : mountain;

  const slug = combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // hilangkan aksen
    .replace(/[^a-z0-9]+/g, '-') // ganti spasi/simbol dengan tanda strip
    .replace(/^-+|-+$/g, ''); // bersihkan strip di awal dan akhir

  return slug || trip.id;
}

/**
 * Menghasilkan slug unik untuk trip.
 * Jika ada trip lain dengan nama dan jalur yang sama, tambahkan penanda tanggal/bulan.
 */
export function getTripSlug(trip: Trip, allTrips: Trip[] = []): string {
  if (!trip) return '';
  let baseSlug = createTripSlug(trip);
  if (!baseSlug) return trip.id;

  // Cek duplikasi dengan trip lain
  const duplicates = allTrips.filter(
    (t) => t.id !== trip.id && createTripSlug(t) === baseSlug
  );

  if (duplicates.length > 0 && trip.tanggal_mulai) {
    const parts = trip.tanggal_mulai.split('-');
    if (parts.length === 3) {
      const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
      const monthShort = months[parseInt(parts[1], 10) - 1] || '';
      baseSlug = `${baseSlug}-${parseInt(parts[2], 10)}${monthShort}`;
    }
  }

  return baseSlug;
}

/**
 * Menghasilkan URL lengkap Media Kit yang siap dibagikan ke WhatsApp tim
 */
export function getTripMediaKitUrl(trip: Trip, allTrips: Trip[] = []): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const slug = getTripSlug(trip, allTrips);
  return `${origin}${pathname}?kit=${slug}`;
}

/**
 * Menemukan trip berdasarkan Slug ataupun ID asli (Mendukung Backward Compatibility)
 */
export function findTripBySlugOrId(trips: Trip[], identifier: string): Trip | undefined {
  if (!identifier || !Array.isArray(trips) || trips.length === 0) return undefined;
  const decoded = decodeURIComponent(identifier).trim().toLowerCase();

  // 1. Prioritas 1: Cocok persis dengan ID database (misal: trip-1789493123238)
  const byId = trips.find((t) => t.id && t.id.toLowerCase() === decoded);
  if (byId) return byId;

  // 2. Prioritas 2: Cocok persis dengan slug unik lengkap
  const byUniqueSlug = trips.find((t) => getTripSlug(t, trips).toLowerCase() === decoded);
  if (byUniqueSlug) return byUniqueSlug;

  // 3. Prioritas 3: Cocok dengan base slug (nama gunung + jalur)
  const byBaseSlug = trips.find((t) => createTripSlug(t).toLowerCase() === decoded);
  if (byBaseSlug) return byBaseSlug;

  // 4. Prioritas 4: Pencocokan parsial toleran (misal pengguna cuma ketik ?kit=sindoro)
  const byPartial = trips.find((t) => {
    const s = createTripSlug(t).toLowerCase();
    return s.startsWith(decoded) || decoded.startsWith(s);
  });
  if (byPartial) return byPartial;

  return undefined;
}
