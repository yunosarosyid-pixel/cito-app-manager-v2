import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  MessageCircle,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  Info,
  Check,
  ShieldCheck,
  FileText,
  PackageCheck,
  PackageX,
  UserCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Trip, MeetingPoint, TripSchedule, TripDefaults } from '../types';
import { POPULAR_MOUNTAINS } from '../data/mountains';
import {
  DEFAULT_CITO_INCLUDE,
  DEFAULT_CITO_EXCLUDE,
  DEFAULT_CITO_SK,
  DEFAULT_CITO_CATATAN_PENTING,
} from './TripModal';
import { calculateDuration, computeAutoEndDate, generateDefaultItinerary } from '../utils/formatters';
import { saveTripToCloud, subscribeToTripDefaults } from '../firebase';
import { saveStoredTrips, getStoredTrips, getAdminPhone, setMasYunoAuthenticated } from '../utils/storage';
import { playIncomingDraftChime } from '../utils/audioNotify';
import { ItineraryEditor } from './ItineraryEditor';

interface TeamInputViewProps {
  onUnlockAdmin?: () => void;
  onTripSubmitted?: (trip: Trip) => void;
}

export const TeamInputView: React.FC<TeamInputViewProps> = ({
  onUnlockAdmin,
  onTripSubmitted,
}) => {
  const [namaPenginput, setNamaPenginput] = useState('');
  const [selectedMountainIndex, setSelectedMountainIndex] = useState<string>('0');
  const [namaGunung, setNamaGunung] = useState('');
  const [ketinggianMdpl, setKetinggianMdpl] = useState('');
  const [jalur, setJalur] = useState('');
  const [customTrail, setCustomTrail] = useState('');
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
  const [includeText, setIncludeText] = useState(DEFAULT_CITO_INCLUDE.join('\n'));
  const [excludeText, setExcludeText] = useState(DEFAULT_CITO_EXCLUDE.join('\n'));
  const [extraPorter, setExtraPorter] = useState('Jika di perlukan');
  const [skText, setSkText] = useState(DEFAULT_CITO_SK.join('\n'));
  const [itinerary, setItinerary] = useState('');
  const [catatanTim, setCatatanTim] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTrip, setSubmittedTrip] = useState<Trip | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Default trip dari Firestore (settings/trip_defaults), diatur admin lewat
  // TripModal, supaya form input tim ini otomatis ikut default terbaru di
  // semua device.
  const [cloudDefaults, setCloudDefaults] = useState<TripDefaults | null>(null);
  const cloudDefaultsAppliedRef = React.useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToTripDefaults((defaults) => {
      setCloudDefaults(defaults);
    });
    return () => unsubscribe();
  }, []);

  // Terapkan default cloud sekali saat pertama kali diterima, tanpa menimpa
  // apa pun yang sudah sempat diketik pengguna.
  useEffect(() => {
    if (!cloudDefaults || cloudDefaultsAppliedRef.current) return;
    cloudDefaultsAppliedRef.current = true;
    if (cloudDefaults.durasi) setDurasi(cloudDefaults.durasi);
    if (cloudDefaults.min_peserta) setMinPeserta(cloudDefaults.min_peserta);
    if (cloudDefaults.min_peserta_jakarta) setMinPesertaJakarta(cloudDefaults.min_peserta_jakarta);
    if (cloudDefaults.max_peserta) setMaxPeserta(cloudDefaults.max_peserta);
    if (cloudDefaults.harga_mepo && cloudDefaults.harga_mepo.length > 0) {
      setMepoList(cloudDefaults.harga_mepo);
    }
    if (cloudDefaults.include && cloudDefaults.include.length > 0) {
      setIncludeText(cloudDefaults.include.join('\n'));
    }
    if (cloudDefaults.exclude && cloudDefaults.exclude.length > 0) {
      setExcludeText(cloudDefaults.exclude.join('\n'));
    }
    if (cloudDefaults.extra_porter) setExtraPorter(cloudDefaults.extra_porter);
    if (cloudDefaults.sk_berlaku && cloudDefaults.sk_berlaku.length > 0) {
      setSkText(cloudDefaults.sk_berlaku.join('\n'));
    }
  }, [cloudDefaults]);

  const currentMountain = POPULAR_MOUNTAINS[parseInt(selectedMountainIndex, 10)] || null;

  // Initialize with default Sindoro data
  useEffect(() => {
    const defaultMtn = POPULAR_MOUNTAINS[0];
    setNamaGunung(defaultMtn.name);
    setKetinggianMdpl(defaultMtn.height);
    setJalur(defaultMtn.trails[0] || 'Via Kledung');

    // Default dates 2 weeks ahead
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);
    const dayAfter = new Date(nextWeek);
    dayAfter.setDate(nextWeek.getDate() + 1);

    const startStr = nextWeek.toISOString().split('T')[0];
    const endStr = dayAfter.toISOString().split('T')[0];
    setTanggalMulai(startStr);
    setTanggalSelesai(endStr);
    setDurasi(calculateDuration(startStr, endStr));

    const defaultItin = generateDefaultItinerary(
      defaultMtn.name,
      defaultMtn.trails[0] || 'Via Kledung',
      startStr,
      endStr
    );
    setItinerary(defaultItin);
  }, []);

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
        // Sync itinerary
        setItinerary(generateDefaultItinerary(m.name, firstTrail, tanggalMulai, tanggalSelesai));
      }
    }
  };

  const handleStartDateChange = (val: string) => {
    setTanggalMulai(val);
    if (val) {
      const autoEnd = computeAutoEndDate(val, tanggalSelesai);
      setTanggalSelesai(autoEnd);
      const newDurasi = calculateDuration(val, autoEnd);
      setDurasi(newDurasi);
    }
  };

  const handleEndDateChange = (val: string) => {
    setTanggalSelesai(val);
    if (tanggalMulai && val) {
      const newDurasi = calculateDuration(tanggalMulai, val);
      setDurasi(newDurasi);
    }
  };

  const handleAddSchedule = () => {
    setJadwalTambahan([
      ...jadwalTambahan,
      {
        id: `batch-${Date.now()}`,
        tanggal_mulai: '',
        tanggal_selesai: '',
        durasi: durasi,
        label: `Jadwal ${jadwalTambahan.length + 2}`,
      },
    ]);
  };

  const handleUpdateSchedule = (index: number, field: keyof TripSchedule, val: string) => {
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

  const handleRemoveSchedule = (index: number) => {
    setJadwalTambahan(jadwalTambahan.filter((_, i) => i !== index));
  };

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

  const handleResetForm = () => {
    setSubmittedTrip(null);
    setSelectedMountainIndex('0');
    const defaultMtn = POPULAR_MOUNTAINS[0];
    setNamaGunung(defaultMtn.name);
    setKetinggianMdpl(defaultMtn.height);
    setJalur(defaultMtn.trails[0] || 'Via Kledung');
    setJadwalTambahan([]);
    setMepoList([
      { lokasi: 'Basecamp', harga: 'IDR 600.000' },
      { lokasi: 'Madiun', harga: 'IDR 700.000' },
      { lokasi: 'Surabaya', harga: 'IDR 850.000' },
    ]);
    setIncludeText(DEFAULT_CITO_INCLUDE.join('\n'));
    setExcludeText(DEFAULT_CITO_EXCLUDE.join('\n'));
    setExtraPorter('Jika di perlukan');
    setSkText(DEFAULT_CITO_SK.join('\n'));
    setCatatanTim('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaGunung.trim() || !jalur.trim()) {
      alert('Nama Gunung dan Jalur wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const tripId = `trip-draft-${Date.now()}`;
    const finalItinerary = itinerary.trim() || generateDefaultItinerary(namaGunung, jalur, tanggalMulai, tanggalSelesai);

    const newTrip: Trip = {
      id: tripId,
      nama_gunung: namaGunung.trim(),
      ketinggian_mdpl: ketinggianMdpl.trim(),
      jalur: jalur.trim(),
      status: 'Buka',
      is_draft: true,
      from_team: true,
      draf_oleh: namaPenginput.trim() || 'wong caruban',
      draf_catatan: catatanTim.trim() || undefined,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      durasi: durasi.trim(),
      jadwal_tambahan: jadwalTambahan.filter((j) => j.tanggal_mulai && j.tanggal_selesai),
      min_peserta: minPeserta.trim() || '15',
      min_peserta_jakarta: minPesertaJakarta.trim() || minPeserta.trim() || '15',
      max_peserta: maxPeserta.trim() || '30',
      harga_mepo: mepoList.filter((m) => m.lokasi.trim() || m.harga.trim()),
      include: includeText.split('\n').map((s) => s.trim()).filter(Boolean),
      exclude: excludeText.split('\n').map((s) => s.trim()).filter(Boolean),
      extra_porter: extraPorter.trim() || 'Jika di perlukan',
      sk_berlaku: skText.split('\n').map((s) => s.trim()).filter(Boolean),
      catatan_penting: cloudDefaults?.catatan_penting || DEFAULT_CITO_CATATAN_PENTING,
      itinerary: finalItinerary,
      kontak_wa: '+6282230444428 / +6289503689266',
      kontak_wa_jatim: '+6282230444428',
      kontak_wa_jakarta: '+6289503689266',
      kontak_ig: '@citoadventuremadiun',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      // 1. Save directly to Cloud Firestore (instant push across all devices)
      await saveTripToCloud(newTrip);

      // 2. Also save to local storage if running in same browser
      const existing = getStoredTrips();
      saveStoredTrips([newTrip, ...existing]);

      // 3. Play pleasant success audio chime
      playIncomingDraftChime();

      setSubmittedTrip(newTrip);
      if (onTripSubmitted) {
        onTripSubmitted(newTrip);
      }
    } catch (err) {
      console.error('Failed to submit team trip to Cloud:', err);
      // Fallback local save
      const existing = getStoredTrips();
      saveStoredTrips([newTrip, ...existing]);
      setSubmittedTrip(newTrip);
      setSubmitError('Tersimpan di memori perangkat ini. Jika Mas Yuno menggunakan perangkat lain, silakan klik tombol WhatsApp di bawah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyWhatsApp = () => {
    if (!submittedTrip) return;
    const adminPhone = getAdminPhone();
    const phoneClean = adminPhone.replace(/[^0-9]/g, '') || '6282230444428';
    const text = `HOEEE MAS YUNO...! Saya (${submittedTrip.draf_oleh || 'Tim'}) sudah menginput draf jadwal trip baru:\n\n🏔️ *${submittedTrip.nama_gunung}* ${submittedTrip.ketinggian_mdpl ? `(${submittedTrip.ketinggian_mdpl})` : ''}\n📍 *Jalur:* ${submittedTrip.jalur}\n🗓️ *Jadwal:* ${submittedTrip.tanggal_mulai} s/d ${submittedTrip.tanggal_selesai} (${submittedTrip.durasi})\n👥 *Kuota:* ${submittedTrip.min_peserta}–${submittedTrip.max_peserta} Orang\n\nData sudah otomatis masuk ke sistem Cloud CITO Adventure & siap di-review untuk diterbitkan!`;
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#d1d1d1] text-[#1a2e16] font-['Plus_Jakarta_Sans'] flex flex-col">
      {/* Header Form Tim */}
      <header className="bg-[#275d1d] text-white border-b-4 border-[#1f4a17] shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-emerald-200 font-['Space_Grotesk']">
                Lembar Kerja Lapangan
              </div>
              <h1 className="text-base sm:text-lg font-extrabold font-['Space_Grotesk'] leading-tight">
                Input Jadwal Trip – Tim CITO Adventure
              </h1>
            </div>
          </div>

          {/* Mode Controls */}
          <div className="flex items-center gap-2">
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/70 border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wide shadow-xs select-none"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Khusus Tim Lapangan</span>
            </div>

            {onUnlockAdmin && (
              <button
                type="button"
                onClick={onUnlockAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
                title="Beralih ke Mode Admin (Mas Yuno)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-950" />
                <span>Buka Mode Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto p-3 sm:p-6 flex-1">
        {submittedTrip ? (
          /* SUCCESS STATE CARD */
          <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-widest text-[#275d1d]">
                Berhasil Tersimpan Langsung
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-[#275d1d]">
                Draf Jadwal Berhasil Dikirim ke Mas Yuno!
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 max-w-md mx-auto">
                Data jadwal <strong>{submittedTrip.nama_gunung}</strong> ({submittedTrip.jalur}) telah tersimpan langsung di database cloud dan siap ditinjau Mas Yuno.
              </p>
            </div>

            {/* Trip Brief Card */}
            <div className="bg-[#f4f4f4] border border-[#275d1d]/30 rounded-xl p-4 text-left text-xs space-y-1.5 max-w-md mx-auto">
              <div className="font-bold text-[#275d1d] text-sm">
                🏔️ {submittedTrip.nama_gunung} {submittedTrip.ketinggian_mdpl}
              </div>
              <div className="text-gray-700">📍 Jalur: {submittedTrip.jalur}</div>
              <div className="text-gray-700">
                🗓️ Tanggal: {submittedTrip.tanggal_mulai} s/d {submittedTrip.tanggal_selesai} ({submittedTrip.durasi})
              </div>
              <div className="text-gray-700">
                👥 Kuota: {submittedTrip.min_peserta}–{submittedTrip.min_peserta_jakarta || submittedTrip.min_peserta} / {submittedTrip.max_peserta} Pax
              </div>
              <div className="text-gray-500 text-[11px] pt-1">
                Diinput oleh: <strong>{submittedTrip.draf_oleh}</strong>
              </div>
            </div>

            {submitError && (
              <div className="max-w-md mx-auto p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleNotifyWhatsApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Notifikasi WhatsApp ke Mas Yuno</span>
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Jadwal Trip Lainnya</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Intro Notice matching User Greeting */}
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-emerald-950 flex items-start gap-2.5 shadow-xs">
              <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>HOEEE TIM...!</strong> Silakan isi formulir jadwal di bawah ini. Setelah Anda menekan tombol <em>"Kirim Draf ke Mas Yuno"</em> di bagian bawah, data akan otomatis masuk ke aplikasi utama untuk diolah menjadi poster pamflet dan caption medsos.
              </div>
            </div>

            {/* Section 0: Identitas Penginput */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#275d1d]" />
                Nama Tim Penyusun Jadwal
              </h3>
              <div>
                <input
                  type="text"
                  value={namaPenginput}
                  onChange={(e) => setNamaPenginput(e.target.value)}
                  placeholder="Contoh: wong caruban / Bagian Jadwal"
                  className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#275d1d]"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  *Nama Anda akan tercantum di draf agar Mas Yuno mengetahui siapa yang menyusun jadwal ini.
                </span>
              </div>
            </div>

            {/* Section 1: Identitas Gunung & Jalur Pendakian */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
              <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#275d1d]" />
                1. Identitas Gunung & Jalur Pendakian
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Pilih Gunung Populer Indonesia (Lengkap MDPL):
                </label>
                <select
                  value={selectedMountainIndex}
                  onChange={handleMountainChange}
                  className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 font-bold focus:border-[#275d1d] focus:outline-none"
                >
                  {POPULAR_MOUNTAINS.map((mtn, idx) => (
                    <option key={mtn.name} value={idx.toString()}>
                      {mtn.name} ({mtn.height}) – {mtn.province}
                    </option>
                  ))}
                  <option value="custom">-- Ketik Gunung Lain Manual --</option>
                </select>
              </div>

              {selectedMountainIndex === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Nama Gunung:
                    </label>
                    <input
                      type="text"
                      value={namaGunung}
                      onChange={(e) => setNamaGunung(e.target.value)}
                      placeholder="Contoh: Gunung Argopuro"
                      required
                      className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 focus:border-[#275d1d] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Ketinggian (MDPL):
                    </label>
                    <input
                      type="text"
                      value={ketinggianMdpl}
                      onChange={(e) => setKetinggianMdpl(e.target.value)}
                      placeholder="3.088 MDPL"
                      className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 focus:border-[#275d1d] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Via Jalur Pendakian (Pilih rekomendasi atau ketik sendiri):
                </label>
                {currentMountain && currentMountain.trails.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={jalur}
                      onChange={(e) => setJalur(e.target.value)}
                      className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 font-bold focus:border-[#275d1d] focus:outline-none"
                    >
                      {currentMountain.trails.map((tr) => (
                        <option key={tr} value={tr}>
                          {tr}
                        </option>
                      ))}
                      <option value="custom_trail">-- Ketik Jalur Lain --</option>
                    </select>

                    {jalur === 'custom_trail' && (
                      <input
                        type="text"
                        value={customTrail}
                        onChange={(e) => {
                          setCustomTrail(e.target.value);
                          setJalur(e.target.value);
                        }}
                        placeholder="Ketik nama jalur khusus..."
                        className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={jalur}
                    onChange={(e) => setJalur(e.target.value)}
                    placeholder="Contoh: Via Baderan Lintas Bremi"
                    required
                    className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#275d1d] focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Section 2: Tanggal Pelaksanaan & Durasi Otomatis */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#275d1d]" />
                  2. Tanggal Pelaksanaan & Durasi Otomatis
                </h3>
                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#275d1d] hover:bg-[#1f4a17] px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Tanggal</span>
                </button>
              </div>

              {/* Jadwal 1 */}
              <div className="p-3.5 bg-[#f4f4f4] border border-[#275d1d]/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#275d1d] text-white">
                    📅 Jadwal 1
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Tanggal Mulai Pendakian:
                    </label>
                    <input
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                      className="w-full bg-white border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium focus:border-[#275d1d] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Tanggal Selesai:
                    </label>
                    <input
                      type="date"
                      value={tanggalSelesai}
                      min={tanggalMulai || undefined}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      required
                      className="w-full bg-white border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium focus:border-[#275d1d] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#275d1d]" />
                    Durasi Pendakian (Otomatis Menghitung Hari/Malam):
                  </label>
                  <input
                    type="text"
                    value={durasi}
                    onChange={(e) => setDurasi(e.target.value)}
                    className="w-full bg-white border border-[#275d1d] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-[#275d1d] focus:outline-none"
                  />
                </div>
              </div>

              {/* Jadwal Tambahan (Jadwal 2, 3, dst.) */}
              {jadwalTambahan.map((sch, idx) => (
                <div
                  key={sch.id || idx}
                  className="p-3.5 bg-[#f4f4f4] border-2 border-dashed border-[#275d1d]/40 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#e8efe6] text-[#275d1d] border border-[#275d1d]/40">
                      📅 Jadwal {idx + 2}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(idx)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Mulai:</label>
                      <input
                        type="date"
                        value={sch.tanggal_mulai}
                        onChange={(e) => handleUpdateSchedule(idx, 'tanggal_mulai', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Selesai:</label>
                      <input
                        type="date"
                        value={sch.tanggal_selesai}
                        min={sch.tanggal_mulai || undefined}
                        onChange={(e) => handleUpdateSchedule(idx, 'tanggal_selesai', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">Durasi:</label>
                    <input
                      type="text"
                      value={sch.durasi || durasi}
                      onChange={(e) => handleUpdateSchedule(idx, 'durasi', e.target.value)}
                      className="w-full bg-white border border-[#275d1d]/40 rounded px-2.5 py-1 text-xs font-bold text-[#275d1d]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Section 3: Kuota Peserta (SKEMA BARU) */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#275d1d]" />
                  3. Kuota Peserta (Skema Baru)
                </h3>
                <span className="text-[11px] font-bold text-[#275d1d] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Tampilan: {minPeserta || '15'} – {minPesertaJakarta || '15'} / {maxPeserta || '30'} Pax
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Min. Madiun / Jawa (pax):
                  </label>
                  <input
                    type="number"
                    value={minPeserta}
                    onChange={(e) => setMinPeserta(e.target.value)}
                    placeholder="15"
                    className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#275d1d]"
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">Patokan pamflet flyer</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Min. Khusus Jakarta (pax):
                  </label>
                  <input
                    type="number"
                    value={minPesertaJakarta}
                    onChange={(e) => setMinPesertaJakarta(e.target.value)}
                    placeholder="15"
                    className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#275d1d]"
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">Khusus mepo Jakarta</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Maksimal Total (pax):
                  </label>
                  <input
                    type="number"
                    value={maxPeserta}
                    onChange={(e) => setMaxPeserta(e.target.value)}
                    placeholder="30"
                    className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#275d1d]"
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">Batas maksimal kuota</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#275d1d]" />
                <span>(Jika peserta kurang akan ada penyesuaian harga)</span>
              </div>
            </div>

            {/* Section 4: Harga Titik Kumpul (Meeting Point / MEPO) */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#275d1d]" />
                  4. Harga Titik Kumpul (Meeting Point / MEPO)
                </h3>
                <button
                  type="button"
                  onClick={handleAddMepo}
                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#275d1d] hover:bg-[#1f4a17] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah MEPO</span>
                </button>
              </div>

              <div className="space-y-2">
                {mepoList.map((mepo, idx) => (
                  <div key={idx} className="space-y-1 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                      <input
                        type="text"
                        value={mepo.lokasi}
                        onChange={(e) => handleMepoChange(idx, 'lokasi', e.target.value)}
                        placeholder="Lokasi (mis. Basecamp, Madiun, Surabaya)"
                        className="flex-1 min-w-0 bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#275d1d]"
                      />
                      <input
                        type="text"
                        value={mepo.harga}
                        onChange={(e) => handleMepoChange(idx, 'harga', e.target.value)}
                        placeholder="IDR 600.000 / fleksibel"
                        title={mepo.harga}
                        className="w-28 sm:w-44 shrink-0 min-w-0 bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold text-[#275d1d] focus:outline-none focus:border-[#275d1d]"
                      />
                      {mepoList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMepo(idx)}
                          className="shrink-0 p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {/* Tombol Cepat / Shortcut Keterangan Peserta */}
                    <div className="flex items-center gap-1 pl-0.5">
                      <button
                        type="button"
                        onClick={() => handleMepoChange(idx, 'harga', '(Menyesuaikan jumlah peserta)')}
                        className="text-[10px] text-[#275d1d] hover:text-[#1a3814] hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                        title="Klik untuk otomatis mengisi '(Menyesuaikan jumlah peserta)'"
                      >
                        ⚡ (Menyesuaikan jumlah peserta)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Fasilitas Include */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#275d1d]" />
                  5. Fasilitas Include
                </h3>
                <button
                  type="button"
                  onClick={() => setIncludeText(DEFAULT_CITO_INCLUDE.join('\n'))}
                  className="text-[11px] font-bold text-[#275d1d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Include</span>
                </button>
              </div>

              <textarea
                value={includeText}
                onChange={(e) => setIncludeText(e.target.value)}
                rows={7}
                className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg p-3 text-xs sm:text-sm text-gray-900 font-sans focus:outline-none focus:border-[#275d1d] leading-relaxed"
                placeholder="Tulis 1 fasilitas include per baris..."
              />
              <span className="text-[10px] text-gray-500 block">
                *Pisahkan setiap item fasilitas include dengan baris baru (Enter).
              </span>
            </div>

            {/* Section 6: Fasilitas Exclude */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                  <PackageX className="w-4 h-4 text-[#275d1d]" />
                  6. Fasilitas Exclude
                </h3>
                <button
                  type="button"
                  onClick={() => setExcludeText(DEFAULT_CITO_EXCLUDE.join('\n'))}
                  className="text-[11px] font-bold text-[#275d1d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Exclude</span>
                </button>
              </div>

              <textarea
                value={excludeText}
                onChange={(e) => setExcludeText(e.target.value)}
                rows={5}
                className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg p-3 text-xs sm:text-sm text-gray-900 font-sans focus:outline-none focus:border-[#275d1d] leading-relaxed"
                placeholder="Tulis 1 fasilitas exclude per baris..."
              />
            </div>

            {/* Section 7: Extra Porter Pribadi (Opsional) */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#275d1d]" />
                7. Extra Porter Pribadi (Opsional)
              </h3>
              <div>
                <input
                  type="text"
                  value={extraPorter}
                  onChange={(e) => setExtraPorter(e.target.value)}
                  placeholder="Jika di perlukan/tulis harga porter"
                  className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#275d1d]"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  *Default: "Jika di perlukan". Bisa diganti dengan nominal harga porter jika sudah ada kesepakatan.
                </span>
              </div>
            </div>

            {/* Section 8: Syarat Ketentuan & Catatan Penting */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#275d1d]" />
                  8. Syarat Ketentuan & Catatan Penting
                </h3>
                <button
                  type="button"
                  onClick={() => setSkText(DEFAULT_CITO_SK.join('\n'))}
                  className="text-[11px] font-bold text-[#275d1d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default S&K</span>
                </button>
              </div>

              <textarea
                value={skText}
                onChange={(e) => setSkText(e.target.value)}
                rows={5}
                className="w-full bg-[#f4f4f4] border border-[#275d1d]/40 rounded-lg p-3 text-xs sm:text-sm text-gray-900 font-sans focus:outline-none focus:border-[#275d1d] leading-relaxed"
                placeholder="Tulis 1 poin syarat & ketentuan per baris..."
              />
            </div>

            {/* Section 9: Itinerary / Rundown Kegiatan (Kolom & Tabel Input Builder) */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#275d1d]/20">
                <div>
                  <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#275d1d]" />
                    9. Itinerary / Rundown Kegiatan
                  </h3>
                  <span className="text-[10px] text-gray-600 block mt-0.5">
                    Pilih jam dengan mudah menggunakan dropdown interval 15 menit, isi hari, tanggal, & keterangan.
                  </span>
                </div>
              </div>

              <ItineraryEditor
                value={itinerary}
                onChange={setItinerary}
                namaGunung={namaGunung}
                jalur={jalur}
                tanggalMulai={tanggalMulai}
                tanggalSelesai={tanggalSelesai}
                hidePreviewText={true}
              />
            </div>

            {/* Section 10: Catatan Khusus dari Tim (Opsional) */}
            <div className="bg-white border-2 border-[#275d1d] rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
              <h3 className="text-xs font-bold text-[#275d1d] uppercase tracking-wider font-['Space_Grotesk'] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#275d1d]" />
                10. Catatan Khusus dari Tim (Opsional)
              </h3>
              <textarea
                value={catatanTim}
                onChange={(e) => setCatatanTim(e.target.value)}
                placeholder="Misal: 'Mas Yuno, untuk jalur ini kuota simaksi terbatas, mohon segera upload pamfletnya ya.'"
                rows={2}
                className="w-full bg-[#f4f4f4] border border-[#275d1d]/30 rounded-lg p-3 text-xs text-gray-900 focus:outline-none focus:border-[#275d1d]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-[#275d1d] hover:bg-[#1f4a17] text-white font-extrabold text-sm sm:text-base font-['Space_Grotesk'] shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan ke Sistem Mas Yuno...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Kirim Draf ke Mas Yuno (Database)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
