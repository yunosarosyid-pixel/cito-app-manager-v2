export type TripStatus = 'Buka' | 'Tutup';

export interface MeetingPoint {
  lokasi: string;
  harga: string;
}

export interface TripSchedule {
  id?: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  durasi?: string;
  label?: string;
}

export interface Trip {
  id: string;
  nama_gunung: string;
  ketinggian_mdpl: string;
  jalur: string;
  status: TripStatus;
  tanggal_mulai: string;
  tanggal_selesai: string;
  durasi: string;
  jadwal_tambahan?: TripSchedule[];
  min_peserta: string;
  min_peserta_jakarta?: string;
  max_peserta: string;
  harga_mepo: MeetingPoint[];
  include: string[];
  exclude: string[];
  extra_porter?: string;
  sk_berlaku: string[];
  catatan_penting?: string;
  itinerary: string;
  kontak_wa: string;
  kontak_wa_jatim?: string;
  kontak_wa_jakarta?: string;
  kontak_ig: string;
  background_url?: string;
  background_overlay_dim?: number;
  slide6_photo_url?: string;
  logo_url?: string;
  is_draft?: boolean;
  from_team?: boolean;
  draf_oleh?: string;
  draf_catatan?: string;
  created_at: number;
  updated_at: number;
}

export interface TripDefaults {
  durasi?: string;
  min_peserta?: string;
  min_peserta_jakarta?: string;
  max_peserta?: string;
  harga_mepo?: MeetingPoint[];
  include?: string[];
  exclude?: string[];
  extra_porter?: string;
  sk_berlaku?: string[];
  catatan_penting?: string;
  kontak_wa_jatim?: string;
  kontak_wa_jakarta?: string;
  kontak_ig?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  status: string; // e.g. Guide, Porter, Kameramen, Leader, Sweeper
  nama: string;
  no_wa: string;
  instagram: string;
  created_at?: number;
}

export interface MountainItem {
  name: string;
  height: string; // e.g. "3.153 MDPL"
  province: string;
  trails: string[];
}
