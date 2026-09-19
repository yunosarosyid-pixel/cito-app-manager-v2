import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { Trip, TripStatus, MeetingPoint, TripSchedule, TripDefaults } from '../types';
import { POPULAR_MOUNTAINS } from '../data/mountains';
import { calculateDuration, computeAutoEndDate, generateDefaultItinerary } from '../utils/formatters';
import { ItineraryEditor } from './ItineraryEditor';
import { subscribeToTripDefaults, saveTripDefaultsToCloud } from '../firebase';

// Official Default Lists for Cito Adventure Madiun
export const DEFAULT_CITO_INCLUDE = [
  'Transportasi PP sesuai mepo',
  'Simaksi pendakian',
  'Ojek Basecamp - Portal',
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
];

export const DEFAULT_CITO_EXCLUDE = [
  'Perlengkapan pribadi',
  'Surat sehat',
  'Obat-obatan pribadi khusus',
  'Logistik (camilan pribadi)',
  'Perlengkapan pendakian yang tidak ada di daftar',
  'Tip crew / guide / porter',
];

export const DEFAULT_CITO_SK = [
  'Peserta Untuk Umum (Sendiri Bisa Join)',
  'Apabila kuota tidak terpenuhi, akan ada biaya tambahan sesuai kesepakatan bersama',
  'DP minimal Rp 200.000',
  'Pelunasan Maksimal H-5',
  'Pembatalan Oleh Peserta: DP Hangus',
  'Trip Sesuai Jadwal (Diluar Jadwal Tersedia Private Trip)',
];

export const DEFAULT_CITO_CATATAN_PENTING =
  'SEBELUM MENDAKI, SANGAT DISARANKAN UNTUK RUTIN BEROLAHRAGA SEPERTI JOGGING, HIKING RINGAN, ATAU LATIHAN KARDIO MINIMAL 1-2 MINGGU SEBELUMNYA. MULAILAH DARI LATIHAN RINGAN, TINGKATKAN INTENSITASNYA, DAN PASTIKAN KONDISI TUBUH BENAR-BENAR SIAP.';

// Default hardcoded di atas (DEFAULT_CITO_INCLUDE, dkk) dipakai sebagai fallback/
// "Reset ke Baku Cito". Default aktual yang mengisi form "Trip Baru" disimpan di
// Firestore (koleksi settings/trip_defaults) lewat subscribeToTripDefaults &
// saveTripDefaultsToCloud, supaya sinkron di semua device (HP & laptop) dan bisa
// diedit langsung dari Firebase Console.

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trip: Trip) => void;
  tripToEdit?: Trip | null;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tripToEdit,
}) => {
  const [selectedMountainIndex, setSelectedMountainIndex] = useState<string>('0');
  const [namaGunung, setNamaGunung] = useState('');
  const [ketinggianMdpl, setKetinggianMdpl] = useState('');
  const [jalur, setJalur] = useState('');
  const [customTrail, setCustomTrail] = useState('');
  const [status, setStatus] = useState<TripStatus>('Buka');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [durasi, setDurasi] = useState('2 Hari 1 Malam');
  const [jadwalTambahan, setJadwalTambahan] = useState<TripSchedule[]>([]);
  const [minPeserta, setMinPeserta] = useState('15');
  const [minPesertaJakarta, setMinPesertaJakarta] = useState('15');
  const [maxPeserta, setMaxPeserta] = useState('30');
  const [mepoList, setMepoList] = useState<MeetingPoint[]>([
    { lokasi: 'Basecamp', harga: 'IDR 600.000' },
    { lokasi: 'Madiun', harga: 'IDR 700.000' },
    { lokasi: 'Surabaya', harga: 'IDR 850.000' },
  ]);
  const [includeText, setIncludeText] = useState('');
  const [excludeText, setExcludeText] = useState('');
  const [extraPorter, setExtraPorter] = useState('');
  const [skText, setSkText] = useState('');
  const [catatanPenting, setCatatanPenting] = useState('');
  const [defaultCatatanSaved, setDefaultCatatanSaved] = useState(false);
  const [savedFieldNotice, setSavedFieldNotice] = useState<string | null>(null);
  const [cloudDefaults, setCloudDefaults] = useState<TripDefaults | null>(null);
  const [itinerary, setItinerary] = useState('');
  const [kontakWaJatim, setKontakWaJatim] = useState('+6282230444428');
  const [kontakWaJakarta, setKontakWaJakarta] = useState('+6289503689266');
  const [kontakIg, setKontakIg] = useState('@citoadventuremadiun');
  const [isDraft, setIsDraft] = useState(false);

  // Available trails for currently selected mountain
  const currentMountain = POPULAR_MOUNTAINS[parseInt(selectedMountainIndex, 10)] || null;

  // Menandai apakah default cloud sudah diterapkan untuk sesi "Trip Baru" yang
  // sedang terbuka ini. Mencegah form ter-reset ulang setiap kali cloudDefaults
  // berubah (misalnya tepat setelah menekan "Jadikan Default"), yang sebelumnya
  // membuat isian form yang sedang diketik terasa "kembali ke awal".
  const newTripDefaultsAppliedRef = React.useRef(false);

  // Langganan default trip dari Firestore (settings/trip_defaults), supaya
  // konsisten di semua device dan bisa diedit langsung dari Firebase Console.
  useEffect(() => {
    const unsubscribe = subscribeToTripDefaults((defaults) => {
      setCloudDefaults(defaults);
    });
    return () => unsubscribe();
  }, []);

  // Reset flag setiap kali modal dibuka ulang dalam mode "Trip Baru", supaya
  // default cloud tetap diterapkan saat form benar-benar baru dibuka.
  useEffect(() => {
    if (isOpen && !tripToEdit) {
      newTripDefaultsAppliedRef.current = false;
    }
  }, [isOpen, tripToEdit]);

  useEffect(() => {
    if (tripToEdit) {
      // Edit mode
      setNamaGunung(tripToEdit.nama_gunung);
      setKetinggianMdpl(tripToEdit.ketinggian_mdpl);
      setJalur(tripToEdit.jalur);
      setStatus(tripToEdit.status || 'Buka');
      setTanggalMulai(tripToEdit.tanggal_mulai);
      setTanggalSelesai(tripToEdit.tanggal_selesai);
      setDurasi(tripToEdit.durasi);
      setJadwalTambahan(tripToEdit.jadwal_tambahan || []);
      setMinPeserta(tripToEdit.min_peserta);
      setMinPesertaJakarta(tripToEdit.min_peserta_jakarta || tripToEdit.min_peserta || '15');
      setMaxPeserta(tripToEdit.max_peserta);
      setMepoList(
        tripToEdit.harga_mepo && tripToEdit.harga_mepo.length > 0
          ? tripToEdit.harga_mepo
          : [{ lokasi: '', harga: '' }]
      );
      setIncludeText((tripToEdit.include || []).join('\n'));
      setExcludeText((tripToEdit.exclude || []).join('\n'));
      setExtraPorter(tripToEdit.extra_porter || '');
      setSkText((tripToEdit.sk_berlaku || []).join('\n'));
      setCatatanPenting(tripToEdit.catatan_penting || '');
      setItinerary(tripToEdit.itinerary || '');
      setKontakWaJatim(tripToEdit.kontak_wa_jatim || '+6282230444428');
      setKontakWaJakarta(tripToEdit.kontak_wa_jakarta || '+6289503689266');
      setKontakIg(tripToEdit.kontak_ig || '@citoadventuremadiun');
      setIsDraft(tripToEdit.is_draft ?? false);

      // Check if matches known mountain
      const mIndex = POPULAR_MOUNTAINS.findIndex(
        m => m.name.toLowerCase() === tripToEdit.nama_gunung.toLowerCase()
      );
      if (mIndex !== -1) {
        setSelectedMountainIndex(mIndex.toString());
      } else {
        setSelectedMountainIndex('custom');
      }
    } else {
      // Baru terapkan default sekali per sesi form terbuka; abaikan perubahan
      // cloudDefaults berikutnya selama form masih terbuka (mis. setelah klik
      // "Jadikan Default"), supaya isian yang sedang diketik tidak tertimpa.
      if (newTripDefaultsAppliedRef.current) {
        return;
      }
      newTripDefaultsAppliedRef.current = true;

      // New Trip Default: Gunung Sindoro
      const defaultMtn = POPULAR_MOUNTAINS[0];
      setSelectedMountainIndex('0');
      setNamaGunung(defaultMtn.name);
      setKetinggianMdpl(defaultMtn.height);
      setJalur(defaultMtn.trails[0] || 'Via Kledung');
      setStatus('Buka');
      setTanggalMulai('2026-09-10');
      setTanggalSelesai('2026-09-11');
      setDurasi(cloudDefaults?.durasi || '2 Hari 1 Malam');
      setJadwalTambahan([]);
      setMinPeserta(cloudDefaults?.min_peserta || '15');
      setMinPesertaJakarta(cloudDefaults?.min_peserta_jakarta || '15');
      setMaxPeserta(cloudDefaults?.max_peserta || '30');
      setMepoList(
        cloudDefaults?.harga_mepo && cloudDefaults.harga_mepo.length > 0
          ? cloudDefaults.harga_mepo
          : [
              { lokasi: 'Basecamp', harga: 'IDR 600.000' },
              { lokasi: 'Madiun', harga: 'IDR 700.000' },
              { lokasi: 'Surabaya', harga: 'IDR 850.000' },
            ]
      );
      setIncludeText((cloudDefaults?.include && cloudDefaults.include.length > 0
        ? cloudDefaults.include
        : DEFAULT_CITO_INCLUDE
      ).join('\n'));
      setExcludeText((cloudDefaults?.exclude && cloudDefaults.exclude.length > 0
        ? cloudDefaults.exclude
        : DEFAULT_CITO_EXCLUDE
      ).join('\n'));
      setExtraPorter(cloudDefaults?.extra_porter ?? 'Jika di perlukan');
      setSkText((cloudDefaults?.sk_berlaku && cloudDefaults.sk_berlaku.length > 0
        ? cloudDefaults.sk_berlaku
        : DEFAULT_CITO_SK
      ).join('\n'));
      setCatatanPenting(cloudDefaults?.catatan_penting || DEFAULT_CITO_CATATAN_PENTING);
      setItinerary(generateDefaultItinerary(defaultMtn.name, defaultMtn.trails[0], '2026-09-10', '2026-09-11'));
      setKontakWaJatim(cloudDefaults?.kontak_wa_jatim || '+6282230444428');
      setKontakWaJakarta(cloudDefaults?.kontak_wa_jakarta || '+6289503689266');
      setKontakIg(cloudDefaults?.kontak_ig || '@citoadventuremadiun');
      setIsDraft(false);
    }
  }, [tripToEdit, isOpen, cloudDefaults]);

  // Simpan satu/lebih field sebagai default trip baru ke Firestore (sinkron semua device)
  const handleSaveAsDefault = (fieldLabel: string, patch: TripDefaults) => {
    saveTripDefaultsToCloud(patch)
      .then(() => {
        setSavedFieldNotice(fieldLabel);
        setTimeout(() => setSavedFieldNotice((cur) => (cur === fieldLabel ? null : cur)), 2500);
      })
      .catch((err) => {
        console.warn('Gagal menyimpan default ke cloud:', err);
        window.alert(
          'Gagal menyimpan default ke cloud. Cek koneksi internet Anda, lalu coba lagi.\n\nDetail: ' +
            (err instanceof Error ? err.message : String(err))
        );
      });
  };

  // Handle mountain dropdown change
  const handleMountainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMountainIndex(val);
    if (val === 'custom') {
      setNamaGunung('');
      setKetinggianMdpl('');
      setJalur('');
    } else {
      const m = POPULAR_MOUNTAINS[parseInt(val, 10)];
      if (m) {
        setNamaGunung(m.name);
        setKetinggianMdpl(m.height);
        const firstTrail = m.trails[0] || 'Via Basecamp';
        setJalur(firstTrail);
        // Refresh default itinerary for this mountain if empty or default
        if (!itinerary || itinerary.includes('ITINERARY PENDAKIAN')) {
          setItinerary(generateDefaultItinerary(m.name, firstTrail, tanggalMulai, tanggalSelesai));
        }
      }
    }
  };

  // Handle trail selection
  const handleTrailChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom_trail') {
      setJalur('');
    } else {
      setJalur(val);
      if (itinerary.includes('ITINERARY PENDAKIAN')) {
        setItinerary(generateDefaultItinerary(namaGunung, val, tanggalMulai, tanggalSelesai));
      }
    }
  };

  // When dates change, auto-calculate duration & automatically sync month/date
  const handleStartDateChange = (val: string) => {
    setTanggalMulai(val);
    if (val) {
      const autoEnd = computeAutoEndDate(val, tanggalSelesai);
      setTanggalSelesai(autoEnd);
      setDurasi(calculateDuration(val, autoEnd));
    }
  };

  const handleEndDateChange = (val: string) => {
    setTanggalSelesai(val);
    if (tanggalMulai && val) {
      setDurasi(calculateDuration(tanggalMulai, val));
    }
  };

  // Fill default itinerary template with H-1
  const handleGenerateItinerarySample = () => {
    setItinerary(generateDefaultItinerary(namaGunung, jalur, tanggalMulai, tanggalSelesai));
  };

  // Schedule dynamic helpers (multiple dates per trip)
  const handleAddJadwal = () => {
    const lastStart = jadwalTambahan.length > 0
      ? jadwalTambahan[jadwalTambahan.length - 1].tanggal_mulai
      : tanggalMulai;
    const lastEnd = jadwalTambahan.length > 0
      ? jadwalTambahan[jadwalTambahan.length - 1].tanggal_selesai
      : tanggalSelesai;

    let nextStart = '';
    let nextEnd = '';
    let nextDurasi = durasi || '2 Hari 1 Malam';

    if (lastStart && lastEnd) {
      const s = new Date(lastStart);
      const e = new Date(lastEnd);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        s.setDate(s.getDate() + 7);
        e.setDate(e.getDate() + 7);
        nextStart = s.toISOString().split('T')[0];
        nextEnd = e.toISOString().split('T')[0];
        nextDurasi = calculateDuration(nextStart, nextEnd);
      }
    }

    const nextBatchNumber = jadwalTambahan.length + 2;
    setJadwalTambahan([
      ...jadwalTambahan,
      {
        id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        label: `Jadwal ${nextBatchNumber}`,
        tanggal_mulai: nextStart,
        tanggal_selesai: nextEnd,
        durasi: nextDurasi,
      },
    ]);
  };

  const handleRemoveJadwal = (index: number) => {
    setJadwalTambahan(jadwalTambahan.filter((_, i) => i !== index));
  };

  const handleJadwalChange = (index: number, field: keyof TripSchedule, val: string) => {
    const updated = [...jadwalTambahan];
    const item = { ...updated[index], [field]: val };

    if (field === 'tanggal_mulai') {
      item.tanggal_mulai = val;
      if (val) {
        const autoEnd = computeAutoEndDate(val, item.tanggal_selesai);
        item.tanggal_selesai = autoEnd;
        item.durasi = calculateDuration(val, autoEnd);
      }
    } else if (field === 'tanggal_selesai') {
      item.tanggal_selesai = val;
      if (item.tanggal_mulai && val) {
        item.durasi = calculateDuration(item.tanggal_mulai, val);
      }
    }

    updated[index] = item;
    setJadwalTambahan(updated);
  };

  // Meeting point dynamic helpers
  const handleAddMepo = () => {
    setMepoList([...mepoList, { lokasi: '', harga: '' }]);
  };

  const handleRemoveMepo = (index: number) => {
    setMepoList(mepoList.filter((_, i) => i !== index));
  };

  const handleMepoChange = (index: number, field: 'lokasi' | 'harga', val: string) => {
    const updated = [...mepoList];
    if (field === 'harga') {
      const digits = val.replace(/[^0-9]/g, '');
      const formatted = digits ? `IDR ${Number(digits).toLocaleString('id-ID')}` : val;
      updated[index].harga = formatted;
    } else {
      updated[index].lokasi = val;
    }
    setMepoList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaGunung.trim() || !jalur.trim()) {
      alert('Nama Gunung dan Jalur wajib diisi!');
      return;
    }

    const trip: Trip = {
      id: tripToEdit?.id || `trip-${Date.now()}`,
      nama_gunung: namaGunung.trim(),
      ketinggian_mdpl: ketinggianMdpl.trim(),
      jalur: jalur.trim(),
      status,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      durasi: durasi.trim(),
      jadwal_tambahan: jadwalTambahan.filter(j => j.tanggal_mulai && j.tanggal_selesai),
      min_peserta: minPeserta.trim(),
      min_peserta_jakarta: minPesertaJakarta.trim() || minPeserta.trim(),
      max_peserta: maxPeserta.trim(),
      harga_mepo: mepoList.filter(m => m.lokasi.trim() || m.harga.trim()),
      include: includeText.split('\n').map(s => s.trim()).filter(Boolean),
      exclude: excludeText.split('\n').map(s => s.trim()).filter(Boolean),
      extra_porter: extraPorter.trim(),
      sk_berlaku: skText.split('\n').map(s => s.trim()).filter(Boolean),
      catatan_penting: catatanPenting.trim(),
      itinerary: itinerary.trim(),
      kontak_wa: `${kontakWaJatim.trim()} / ${kontakWaJakarta.trim()}`,
      kontak_wa_jatim: kontakWaJatim.trim(),
      kontak_wa_jakarta: kontakWaJakarta.trim(),
      kontak_ig: kontakIg.trim(),
      background_url: tripToEdit?.background_url || '/default-bg.jpg',
      background_overlay_dim: tripToEdit?.background_overlay_dim ?? 0.2,
      slide6_photo_url: tripToEdit?.slide6_photo_url,
      logo_url: tripToEdit?.logo_url || '',
      is_draft: isDraft,
      from_team: tripToEdit?.from_team ?? false,
      draf_oleh: tripToEdit?.draf_oleh,
      draf_catatan: tripToEdit?.draf_catatan,
      created_at: tripToEdit?.created_at || Date.now(),
      updated_at: Date.now(),
    };

    onSave(trip);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-[#275d1d] text-gray-900 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#275d1d] px-5 sm:px-6 py-4 border-b border-[#275d1d] flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#d1d1d1] uppercase font-['Montserrat']">
              Formulir Trip Cito Adventure
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold font-['Montserrat'] tracking-tight text-white">
              {tripToEdit ? 'Edit Data Trip' : 'Tambah Open Trip Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-black/20 p-1.5 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Gunung & Jalur */}
          <div className="space-y-3 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat'] flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              1. Identitas Gunung & Jalur Pendakian
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Dropdown Nama Gunung */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Pilih Gunung Populer Indonesia (Lengkap MDPL):
                </label>
                <select
                  value={selectedMountainIndex}
                  onChange={handleMountainChange}
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium focus:border-[#275d1d] focus:ring-1 focus:ring-[#275d1d] focus:outline-none"
                >
                  {POPULAR_MOUNTAINS.map((m, idx) => (
                    <option key={idx} value={idx.toString()}>
                      {m.name} ({m.height}) - {m.province}
                    </option>
                  ))}
                  <option value="custom">✏️ Gunung Lainnya (Ketik Manual)</option>
                </select>
              </div>

              {/* Status Trip (Buka / Tutup Saja) */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Status Trip:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('Buka')}
                    className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      status === 'Buka'
                        ? 'bg-[#275d1d] text-white shadow-sm ring-2 ring-[#275d1d]'
                        : 'bg-[#d1d1d1] text-gray-800 hover:bg-[#c4c4c4]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    Buka
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Tutup')}
                    className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      status === 'Tutup'
                        ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-700'
                        : 'bg-[#d1d1d1] text-gray-800 hover:bg-[#c4c4c4]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    Tutup
                  </button>
                </div>
              </div>
            </div>

            {/* If custom mountain is selected */}
            {selectedMountainIndex === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Nama Gunung Kustom:</label>
                  <input
                    type="text"
                    value={namaGunung}
                    onChange={(e) => setNamaGunung(e.target.value)}
                    placeholder="Contoh: Gunung Ciremai"
                    className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Ketinggian (MDPL):</label>
                  <input
                    type="text"
                    value={ketinggianMdpl}
                    onChange={(e) => setKetinggianMdpl(e.target.value)}
                    placeholder="Contoh: 3.078 MDPL"
                    className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Jalur Dropdown & Input */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Via Jalur Pendakian (Pilih rekomendasi atau ketik sendiri):
              </label>
              {currentMountain && currentMountain.trails.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={currentMountain.trails.includes(jalur) ? jalur : 'custom_trail'}
                    onChange={handleTrailChange}
                    className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium focus:border-[#275d1d] focus:outline-none"
                  >
                    {currentMountain.trails.map((t, i) => (
                      <option key={i} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="custom_trail">✏️ Ketik Jalur Lainnya...</option>
                  </select>

                  {(!currentMountain.trails.includes(jalur) || jalur === '') && (
                    <input
                      type="text"
                      value={jalur}
                      onChange={(e) => setJalur(e.target.value)}
                      placeholder="Ketik nama jalur kustom, misal: Via Watu Lunyu"
                      className="w-full bg-white border-2 border-[#275d1d] rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none mt-1"
                      required
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={jalur}
                  onChange={(e) => setJalur(e.target.value)}
                  placeholder="Contoh: Via Kledung"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                  required
                />
              )}
            </div>
          </div>

          {/* Section 2: Tanggal & Durasi (Mendukung Multi Tanggal) */}
          <div className="space-y-3.5 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat'] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                2. Tanggal Pelaksanaan & Durasi Otomatis
              </h3>
              <button
                type="button"
                onClick={handleAddJadwal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#275d1d] hover:bg-[#1f4a17] text-white rounded-md transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Tanggal</span>
              </button>
            </div>

            {/* Jadwal 1 */}
            <div className="bg-white p-3.5 rounded-lg border border-[#275d1d]/30 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#275d1d] text-white">
                  📅 Jadwal 1
                </span>
              </div>

              {/* Date Range: Mulai & Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Tanggal Mulai Pendakian:
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Tanggal Selesai:
                  </label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    min={tanggalMulai || undefined}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Kolom Durasi Tepat di Bawah Tanggal */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#275d1d]" />
                  <span>Durasi Pendakian (Otomatis Menghitung Hari/Malam):</span>
                </label>
                <input
                  type="text"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  placeholder="Contoh: 3 Hari 2 Malam"
                  className="w-full bg-white border-2 border-[#275d1d] rounded-md px-3 py-2 text-xs sm:text-sm text-[#275d1d] font-extrabold focus:border-[#275d1d] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Jadwal Tambahan (Jadwal 2, 3, dst.) */}
            {jadwalTambahan.map((jadwal, idx) => (
              <div
                key={jadwal.id || idx}
                className="bg-white p-3.5 rounded-lg border-2 border-dashed border-[#275d1d]/50 space-y-3 shadow-2xs relative transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#e8efe6] text-[#275d1d] border border-[#275d1d]/40">
                    📅 Jadwal {idx + 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveJadwal(idx)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded transition-colors cursor-pointer"
                    title="Hapus tanggal ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Tanggal Mulai Pendakian:
                    </label>
                    <input
                      type="date"
                      value={jadwal.tanggal_mulai}
                      onChange={(e) => handleJadwalChange(idx, 'tanggal_mulai', e.target.value)}
                      className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Tanggal Selesai:
                    </label>
                    <input
                      type="date"
                      value={jadwal.tanggal_selesai}
                      min={jadwal.tanggal_mulai || undefined}
                      onChange={(e) => handleJadwalChange(idx, 'tanggal_selesai', e.target.value)}
                      className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#275d1d]" />
                    <span>Durasi Pendakian (Otomatis Terhitung):</span>
                  </label>
                  <input
                    type="text"
                    value={jadwal.durasi || ''}
                    onChange={(e) => handleJadwalChange(idx, 'durasi', e.target.value)}
                    placeholder="Contoh: 3 Hari 2 Malam"
                    className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-1.5 text-xs sm:text-sm text-[#275d1d] font-bold focus:border-[#275d1d] focus:outline-none"
                  />
                </div>
              </div>
            ))}

            <p className="text-[11px] text-gray-600 mt-1">
              *Otomatis menghitung hari & malam. Klik <strong>"+ Tambah Tanggal"</strong> di atas jika 1 trip ini memiliki beberapa opsi tanggal keberangkatan.
            </p>
          </div>

          {/* Section 3: Kuota Peserta & Notifikasi (SKEMA BARU) */}
          <div className="space-y-3 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat']">
                3. Kuota Peserta (Skema Baru)
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {savedFieldNotice === 'kuota' && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                    ✓ Tersimpan!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleSaveAsDefault('kuota', {
                      min_peserta: minPeserta.trim(),
                      min_peserta_jakarta: minPesertaJakarta.trim(),
                      max_peserta: maxPeserta.trim(),
                    })
                  }
                  className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Simpan kuota ini sebagai default untuk semua trip baru (tersinkron di semua device)"
                >
                  💾 Jadikan Default
                </button>
                <span className="text-[11px] font-bold text-[#275d1d] bg-[#275d1d]/10 px-2.5 py-0.5 rounded-full border border-[#275d1d]/20">
                  Tampilan: {minPeserta || '15'} – {minPesertaJakarta || '15'} / {maxPeserta || '30'} Pax
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Min. Madiun / Jawa (pax):</label>
                <input
                  type="number"
                  value={minPeserta}
                  onChange={(e) => setMinPeserta(e.target.value)}
                  placeholder="15"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                />
                <span className="text-[10px] text-gray-600 block mt-0.5">Patokan pamflet flyer</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Min. Khusus Jakarta (pax):</label>
                <input
                  type="number"
                  value={minPesertaJakarta}
                  onChange={(e) => setMinPesertaJakarta(e.target.value)}
                  placeholder="15"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                />
                <span className="text-[10px] text-gray-600 block mt-0.5">Khusus mepo Jakarta</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Maksimal Total (pax):</label>
                <input
                  type="number"
                  value={maxPeserta}
                  onChange={(e) => setMaxPeserta(e.target.value)}
                  placeholder="30"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                />
                <span className="text-[10px] text-gray-600 block mt-0.5">Batas maksimal kuota</span>
              </div>
            </div>

            {/* Notifikasi Wajib di Bawah Peserta */}
            <div className="flex items-center gap-2 p-2.5 rounded bg-[#275d1d]/10 border border-[#275d1d]/30 text-[#1b3a16] text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#275d1d]" />
              <span>(Jika peserta kurang akan ada penyesuaian harga)</span>
            </div>
          </div>

          {/* Section 4: Tarif Meeting Point (MEPO) */}
          <div className="space-y-3 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat']">
                4. Tarif per Meeting Point (MEPO)
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {savedFieldNotice === 'mepo' && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                    ✓ Tersimpan!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleSaveAsDefault('mepo', {
                      harga_mepo: mepoList.filter((m) => m.lokasi.trim() || m.harga.trim()),
                    })
                  }
                  className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Simpan daftar titik kumpul & harga ini sebagai default untuk semua trip baru (tersinkron di semua device)"
                >
                  💾 Jadikan Default
                </button>
                <button
                  type="button"
                  onClick={handleAddMepo}
                  className="text-xs font-bold text-[#275d1d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Titik Kumpul
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {mepoList.map((m, idx) => (
                <div key={idx} className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                    <input
                      type="text"
                      value={m.lokasi}
                      onChange={(e) => handleMepoChange(idx, 'lokasi', e.target.value)}
                      placeholder="Lokasi (mis. Basecamp / Stasiun Purwokerto)"
                      className="flex-1 min-w-0 bg-white border border-[#275d1d]/40 rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={m.harga}
                      onChange={(e) => handleMepoChange(idx, 'harga', e.target.value)}
                      placeholder="Harga / (Menyesuaikan)"
                      title={m.harga}
                      className="w-28 sm:w-44 shrink-0 min-w-0 bg-white border border-[#275d1d]/40 rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-[#275d1d] font-bold focus:border-[#275d1d] focus:outline-none"
                    />
                    {mepoList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMepo(idx)}
                        className="shrink-0 p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Shortcut Keterangan Peserta */}
                  <div className="flex items-center gap-1 pl-0.5">
                    <button
                      type="button"
                      onClick={() => handleMepoChange(idx, 'harga', '(Menyesuaikan jumlah peserta)')}
                      className="text-[10px] text-[#275d1d] hover:text-[#1a3814] hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-[#275d1d]/30"
                      title="Klik untuk otomatis mengisi '(Menyesuaikan jumlah peserta)'"
                    >
                      ⚡ (Menyesuaikan jumlah peserta)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Include & Exclude */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-[#275d1d] uppercase font-['Montserrat']">
                  5. Fasilitas Include:
                </label>
                <div className="flex items-center gap-1.5">
                  {savedFieldNotice === 'include' && (
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                      ✓ Tersimpan!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveAsDefault('include', {
                        include: includeText.split('\n').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Simpan daftar include ini sebagai default untuk semua trip baru (tersinkron di semua device)"
                  >
                    💾 Jadikan Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeText(DEFAULT_CITO_INCLUDE.join('\n'))}
                    className="text-[11px] font-bold text-[#275d1d] hover:text-[#1a3814] bg-[#275d1d]/10 hover:bg-[#275d1d]/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Terapkan 14 item fasilitas baku Cito Adventure"
                  >
                    ↺ Pakai Default Cito
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                value={includeText}
                onChange={(e) => setIncludeText(e.target.value)}
                placeholder="Transportasi PP&#10;Simaksi resmi&#10;Tenda & matras&#10;Makan 3x"
                className="w-full bg-white border border-[#275d1d]/40 rounded-md p-2.5 text-xs text-gray-900 focus:border-[#275d1d] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-gray-800 uppercase font-['Montserrat']">
                  Fasilitas Exclude:
                </label>
                <div className="flex items-center gap-1.5">
                  {savedFieldNotice === 'exclude' && (
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                      ✓ Tersimpan!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveAsDefault('exclude', {
                        exclude: excludeText.split('\n').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Simpan daftar exclude ini sebagai default untuk semua trip baru (tersinkron di semua device)"
                  >
                    💾 Jadikan Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcludeText(DEFAULT_CITO_EXCLUDE.join('\n'))}
                    className="text-[11px] font-bold text-[#275d1d] hover:text-[#1a3814] bg-[#275d1d]/10 hover:bg-[#275d1d]/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Terapkan 6 item exclude baku Cito Adventure"
                  >
                    ↺ Pakai Default Cito
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                value={excludeText}
                onChange={(e) => setExcludeText(e.target.value)}
                placeholder="Perlengkapan pribadi&#10;Obat pribadi&#10;Camilan pribadi"
                className="w-full bg-white border border-[#275d1d]/40 rounded-md p-2.5 text-xs text-gray-900 focus:border-[#275d1d] focus:outline-none"
              />
            </div>
          </div>

          {/* Extra porter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-800">
                Extra Porter Pribadi (Opsional):
              </label>
              <div className="flex items-center gap-1.5">
                {savedFieldNotice === 'extra_porter' && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                    ✓ Tersimpan!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveAsDefault('extra_porter', { extra_porter: extraPorter.trim() })}
                  className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Simpan teks ini sebagai default untuk semua trip baru"
                >
                  💾 Jadikan Default
                </button>
              </div>
            </div>
            <input
              type="text"
              value={extraPorter}
              onChange={(e) => setExtraPorter(e.target.value)}
              placeholder="Contoh: Jika di perlukan"
              className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
            />
          </div>

          {/* Section 6: S&K & Catatan Penting */}
          <div className="space-y-3 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat']">
                6. Syarat Ketentuan & Catatan Penting
              </h3>
              <div className="flex items-center gap-1.5">
                {savedFieldNotice === 'sk_berlaku' && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                    ✓ Tersimpan!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleSaveAsDefault('sk_berlaku', {
                      sk_berlaku: skText.split('\n').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Simpan syarat ketentuan ini sebagai default untuk semua trip baru (tersinkron di semua device)"
                >
                  💾 Jadikan Default
                </button>
                <button
                  type="button"
                  onClick={() => setSkText(DEFAULT_CITO_SK.join('\n'))}
                  className="text-[11px] font-bold text-[#275d1d] hover:text-[#1a3814] bg-[#275d1d]/10 hover:bg-[#275d1d]/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Terapkan 6 butir syarat ketentuan baku Cito Adventure"
                >
                  ↺ Pakai Default S&K
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">S&K Berlaku (1 per baris):</label>
              <textarea
                rows={5}
                value={skText}
                onChange={(e) => setSkText(e.target.value)}
                placeholder="Terbuka untuk umum&#10;DP minimal Rp 200.000"
                className="w-full bg-white border border-[#275d1d]/40 rounded-md p-2.5 text-xs text-gray-900 focus:border-[#275d1d] focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                <label className="block text-xs font-bold text-gray-800">Catatan Penting Pendakian:</label>
                <div className="flex items-center gap-1.5">
                  {defaultCatatanSaved && (
                    <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                      ✓ Disimpan sebagai Default!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      saveTripDefaultsToCloud({ catatan_penting: catatanPenting.trim() })
                        .then(() => {
                          setDefaultCatatanSaved(true);
                          setTimeout(() => setDefaultCatatanSaved(false), 3000);
                        })
                        .catch((err) => {
                          console.warn('Gagal menyimpan default ke cloud:', err);
                          window.alert(
                            'Gagal menyimpan default ke cloud. Cek koneksi internet Anda, lalu coba lagi.'
                          );
                        });
                    }}
                    className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Simpan teks catatan penting ini sebagai template default permanen untuk semua trip baru (tersinkron di semua device)"
                  >
                    💾 Simpan Jadi Default Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCatatanPenting(DEFAULT_CITO_CATATAN_PENTING);
                      saveTripDefaultsToCloud({ catatan_penting: DEFAULT_CITO_CATATAN_PENTING })
                        .then(() => {
                          setDefaultCatatanSaved(true);
                          setTimeout(() => setDefaultCatatanSaved(false), 3000);
                        })
                        .catch((err) => {
                          console.warn('Gagal menyimpan default ke cloud:', err);
                          window.alert(
                            'Gagal menyimpan default ke cloud. Cek koneksi internet Anda, lalu coba lagi.'
                          );
                        });
                    }}
                    className="text-[11px] font-bold text-[#275d1d] hover:text-[#1a3814] bg-[#275d1d]/10 hover:bg-[#275d1d]/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Kembalikan ke template catatan penting resmi Cito Adventure"
                  >
                    ↺ Reset Baku Cito
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={catatanPenting}
                onChange={(e) => setCatatanPenting(e.target.value)}
                placeholder="SEBELUM MENDAKI, SANGAT DISARANKAN UNTUK RUTIN BEROLAHRAGA..."
                className="w-full bg-white border border-[#275d1d]/40 rounded-md p-2.5 text-xs text-gray-900 focus:border-[#275d1d] focus:outline-none"
              />
              <span className="text-[10px] text-gray-500 block mt-1">
                💡 Teks ini muncul pada Slide 4 (Catatan Penting) dan caption promosi. Klik <strong>Simpan Jadi Default Baru</strong> jika ingin teks ini otomatis muncul di setiap trip baru.
              </span>
            </div>
          </div>

          {/* Section 7: Kontak Booking (Dual Admin) */}
          <div className="space-y-3 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat']">
                7. Kontak Resmi Pendaftaran (2 Admin Wilayah & Instagram)
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {savedFieldNotice === 'kontak' && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                    ✓ Tersimpan!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleSaveAsDefault('kontak', {
                      kontak_wa_jatim: kontakWaJatim.trim(),
                      kontak_wa_jakarta: kontakWaJakarta.trim(),
                      kontak_ig: kontakIg.trim(),
                    })
                  }
                  className="text-[11px] font-bold text-[#15803D] hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Simpan kontak ini sebagai default untuk semua trip baru (tersinkron di semua device)"
                >
                  💾 Jadikan Default
                </button>
                <span className="text-[11px] font-bold text-[#15803D] bg-green-100 px-2 py-0.5 rounded-full border border-green-300">
                  ✓ Otomatis Aktif di Pamflet & Caption
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Admin Jatim & Jateng:
                </label>
                <input
                  type="text"
                  value={kontakWaJatim}
                  onChange={(e) => setKontakWaJatim(e.target.value)}
                  placeholder="+6282230444428"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs text-gray-900 font-medium focus:border-[#275d1d] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Admin Jakarta & Sekitarnya:
                </label>
                <input
                  type="text"
                  value={kontakWaJakarta}
                  onChange={(e) => setKontakWaJakarta(e.target.value)}
                  placeholder="+6289503689266"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs text-gray-900 font-medium focus:border-[#275d1d] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Instagram Resmi:
                </label>
                <input
                  type="text"
                  value={kontakIg}
                  onChange={(e) => setKontakIg(e.target.value)}
                  placeholder="@citoadventuremadiun"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-md px-3 py-2 text-xs text-gray-900 font-medium focus:border-[#275d1d] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 8: Itinerary / Rundown (Kolom & Tabel Input Builder) - Paling Bawah di Bawah Kontak WA */}
          <div className="space-y-3 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat']">
                8. Itinerary / Rundown Kegiatan (Kolom Hari, Tanggal, Jam & Keterangan)
              </h3>
            </div>
            <p className="text-[11px] text-gray-700">
              Isi rundown kegiatan secara rapi menggunakan kolom Hari, Tanggal, Jam Mulai, Jam Selesai, dan Keterangan. Format teks terstruktur akan dihasilkan otomatis untuk pamflet dan arsip tanpa mempengaruhi bagian lain.
            </p>
            <ItineraryEditor
              value={itinerary}
              onChange={setItinerary}
              namaGunung={namaGunung}
              jalur={jalur}
              tanggalMulai={tanggalMulai}
              tanggalSelesai={tanggalSelesai}
            />
          </div>

          {/* Section 9: Status Kesiapan Trip (Draft vs Final) */}
          <div className="space-y-3 bg-[#f5f5f5] p-4 rounded-lg border border-[#275d1d]/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-[#275d1d] tracking-wider uppercase font-['Montserrat'] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#275d1d]" />
                9. Status Kesiapan Trip (Draft / Final)
              </h3>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  isDraft
                    ? 'bg-amber-100 text-amber-900 border-amber-400'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                }`}
              >
                {isDraft ? '🟡 Mode: Draft (Belum Final)' : '🟢 Mode: Final (Siap Upload)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opsi 1: Final */}
              <div
                onClick={() => setIsDraft(false)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                  !isDraft
                    ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'bg-white border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !isDraft ? 'border-emerald-600 bg-emerald-600' : 'border-gray-400'
                  }`}>
                    {!isDraft && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-950 font-['Montserrat']">
                    🟢 Final (Siap Upload)
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed pl-6">
                  Jadwal, kuota, tarif & itinerary sudah fix. Siap dibuatkan pamflet dan di-broadcast ke medsos.
                </p>
              </div>

              {/* Opsi 2: Draft (Merah Tegas) */}
              <div
                onClick={() => setIsDraft(true)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                  isDraft
                    ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                    : 'bg-white border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isDraft ? 'border-red-500 bg-red-600' : 'border-gray-400'
                  }`}>
                    {isDraft && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-red-950 font-['Montserrat']">
                    🔴 Draft (Belum Final / Konsep)
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed pl-6">
                  Data masih tentatif atau menunggu konfirmasi. Masuk daftar dengan label <strong>🔴 Draft</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-[#275d1d]/20 flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 bg-[#d1d1d1] hover:bg-[#c2c2c2] rounded transition-colors cursor-pointer"
            >
              Batal
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tombol Simpan Cepat sebagai Draft (Merah) */}
              <button
                type="button"
                onClick={(e) => {
                  setIsDraft(true);
                  // Trigger form submit via button click
                  setTimeout(() => {
                    const form = (e.target as HTMLElement).closest('form');
                    if (form) form.requestSubmit();
                  }, 50);
                }}
                className="px-3.5 py-2 text-xs sm:text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 border border-red-700 rounded shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>🔴</span>
                <span>Simpan sebagai Draft</span>
              </button>

              {/* Tombol Simpan Utama (Final) */}
              <button
                type="submit"
                onClick={() => {
                  // Jika pengguna menekan tombol hijau utama ini, kita jadikan Final kecuali jika user sengaja memilih Draft
                }}
                className={`px-5 py-2 text-xs sm:text-sm font-extrabold text-white rounded shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  isDraft
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-[#275d1d] hover:bg-[#1f4a17]'
                }`}
              >
                <span>{isDraft ? '🔴' : '🟢'}</span>
                <span>{tripToEdit ? (isDraft ? 'Simpan Perubahan (Draft)' : 'Simpan Perubahan (Final)') : (isDraft ? 'Simpan Trip (Draft)' : 'Simpan Trip Final')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
