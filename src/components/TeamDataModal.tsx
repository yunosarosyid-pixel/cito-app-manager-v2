import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Phone, Instagram, User, Shield, Save } from 'lucide-react';
import { TeamMember } from '../types';
import {
  getAdminPhone,
  saveAdminPhone,
  getTeamMembers,
  saveTeamMembers,
} from '../utils/storage';

interface TeamDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const TeamDataModal: React.FC<TeamDataModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  // Section A: Nomor Admin
  const [adminPhone, setAdminPhone] = useState(getAdminPhone());
  const [adminSaved, setAdminSaved] = useState(false);

  // Section B: Data Anggota Tim
  const [members, setMembers] = useState<TeamMember[]>(getTeamMembers());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form input state for add/edit member
  const [statusInput, setStatusInput] = useState('Guide');
  const [namaInput, setNamaInput] = useState('');
  const [noWaInput, setNoWaInput] = useState('');
  const [igInput, setIgInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAdminPhone(getAdminPhone());
      setMembers(getTeamMembers());
      setIsAdding(false);
      setEditingId(null);
      setAdminSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAdminPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminPhone.trim();
    if (!clean) {
      alert('Nomor Admin tidak boleh kosong!');
      return;
    }
    saveAdminPhone(clean);
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 2500);
    onShowToast?.('Nomor Admin berhasil disimpan!');
  };

  const handleStartAdd = () => {
    setStatusInput('Guide');
    setNamaInput('');
    setNoWaInput('');
    setIgInput('@');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (m: TeamMember) => {
    setStatusInput(m.status);
    setNamaInput(m.nama);
    setNoWaInput(m.no_wa);
    setIgInput(m.instagram);
    setEditingId(m.id);
    setIsAdding(false);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaInput.trim()) {
      alert('Nama anggota tim wajib diisi!');
      return;
    }

    if (editingId) {
      // Edit
      const updated = members.map((m) =>
        m.id === editingId
          ? {
              ...m,
              status: statusInput.trim() || 'Guide',
              nama: namaInput.trim(),
              no_wa: noWaInput.trim(),
              instagram: igInput.trim().startsWith('@') ? igInput.trim() : `@${igInput.trim()}`,
            }
          : m
      );
      setMembers(updated);
      saveTeamMembers(updated);
      onShowToast?.('Data anggota tim berhasil diperbarui!');
    } else {
      // Add new
      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        status: statusInput.trim() || 'Guide',
        nama: namaInput.trim(),
        no_wa: noWaInput.trim(),
        instagram: igInput.trim().startsWith('@') ? igInput.trim() : `@${igInput.trim()}`,
        created_at: Date.now(),
      };
      const updated = [...members, newMember];
      setMembers(updated);
      saveTeamMembers(updated);
      onShowToast?.('Anggota tim baru berhasil ditambahkan!');
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Hapus anggota tim ini dari daftar?')) {
      const updated = members.filter((m) => m.id !== id);
      setMembers(updated);
      saveTeamMembers(updated);
      onShowToast?.('Anggota tim berhasil dihapus');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-[#275d1d] text-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#275d1d] px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#1f4a17] text-white shrink-0">
          <div>
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-emerald-200 uppercase font-['Space_Grotesk']">
              Manajemen Tim & Admin Cito
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold font-['Space_Grotesk']">
              Data Tim
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* SECTION A: NOMOR ADMIN */}
          <div className="bg-[#f5f5f5] p-4 sm:p-5 rounded-xl border-2 border-[#275d1d]/30 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#275d1d] tracking-wider uppercase font-['Space_Grotesk'] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#275d1d]" />
                Nomor Admin
              </h3>
              <span className="text-[11px] text-gray-600">
                Penerima notifikasi WhatsApp saat tim selesai input trip
              </span>
            </div>

            <form onSubmit={handleSaveAdminPhone} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+6282230444428 atau 08123456789"
                  className="w-full bg-white border border-[#275d1d]/40 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm font-bold text-gray-900 focus:border-[#275d1d] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {adminSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Nomor</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* SECTION B: DATA TIM */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#275d1d] tracking-wider uppercase font-['Space_Grotesk'] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#275d1d]" />
                  Daftar Anggota Tim Cito
                </h3>
                <p className="text-[11px] text-gray-600">
                  Kru lapangan: Guide, Porter, Kameramen, dll.
                </p>
              </div>

              {!isAdding && !editingId && (
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Anggota</span>
                </button>
              )}
            </div>

            {/* Form Tambah / Edit Anggota */}
            {(isAdding || editingId) && (
              <form
                onSubmit={handleSaveMember}
                className="bg-emerald-50/50 border-2 border-[#275d1d] rounded-xl p-4 space-y-3 animate-in fade-in duration-200"
              >
                <div className="text-xs font-bold text-[#275d1d] font-['Space_Grotesk']">
                  {editingId ? 'Edit Data Anggota Tim' : '+ Tambah Anggota Tim Baru'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Status / Peran:
                    </label>
                    <input
                      type="text"
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      placeholder="Guide, Porter, Kameramen, Leader, Sweeper"
                      className="w-full bg-white border border-[#275d1d]/40 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#275d1d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Nama Anggota:
                    </label>
                    <input
                      type="text"
                      value={namaInput}
                      onChange={(e) => setNamaInput(e.target.value)}
                      placeholder="Nama lengkap atau panggilan"
                      className="w-full bg-white border border-[#275d1d]/40 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#275d1d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      No. WhatsApp:
                    </label>
                    <input
                      type="text"
                      value={noWaInput}
                      onChange={(e) => setNoWaInput(e.target.value)}
                      placeholder="+628... atau 08..."
                      className="w-full bg-white border border-[#275d1d]/40 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#275d1d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Instagram:
                    </label>
                    <input
                      type="text"
                      value={igInput}
                      onChange={(e) => setIgInput(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-white border border-[#275d1d]/40 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#275d1d]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#275d1d] hover:bg-[#1f4a17] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            )}

            {/* List Anggota Tim */}
            <div className="space-y-2.5">
              {members.length > 0 ? (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-[#275d1d]/30 hover:border-[#275d1d] transition-all shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#275d1d] text-white">
                          {m.status}
                        </span>
                        <span className="text-sm font-extrabold text-gray-900 font-['Space_Grotesk']">
                          {m.nama}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        {m.no_wa && (
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="w-3 h-3 text-[#275d1d]" />
                            {m.no_wa}
                          </span>
                        )}
                        {m.instagram && (
                          <span className="flex items-center gap-1 font-medium">
                            <Instagram className="w-3 h-3 text-pink-600" />
                            {m.instagram}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(m)}
                        className="p-1.5 rounded-lg text-[#275d1d] hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Edit data anggota"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus anggota"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  Belum ada data anggota tim. Klik <strong>"+ Tambah Anggota"</strong> di atas.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#f5f5f5] px-5 py-3 border-t border-gray-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
