/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import {
  ItineraryDay,
  ItineraryItem,
  generateId,
  structuredToText,
  textToStructured,
  generateDefaultStructuredDays,
} from '../utils/itineraryHelper';
import { TimeDropdown } from './TimeDropdown';

interface ItineraryEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  namaGunung?: string;
  jalur?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  onShowToast?: (msg: string) => void;
  hidePreviewText?: boolean;
}

export const ItineraryEditor: React.FC<ItineraryEditorProps> = ({
  value,
  onChange,
  namaGunung = '',
  jalur = '',
  tanggalMulai = '',
  tanggalSelesai = '',
  onShowToast,
  hidePreviewText = false,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'text'>('table');
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [titleHeader, setTitleHeader] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize structured days from value on first load or when switching to table
  useEffect(() => {
    if (value && value.trim()) {
      const parsed = textToStructured(value);
      setTitleHeader(parsed.title);
      if (parsed.days.length > 0) {
        setDays(parsed.days);
      } else {
        // Fallback default
        const defaultDays = generateDefaultStructuredDays(
          namaGunung,
          jalur,
          tanggalMulai,
          tanggalSelesai
        );
        setDays(defaultDays);
      }
    } else {
      const defaultDays = generateDefaultStructuredDays(
        namaGunung,
        jalur,
        tanggalMulai,
        tanggalSelesai
      );
      setDays(defaultDays);
      const initialText = structuredToText(defaultDays);
      onChange(initialText);
    }
  }, []);

  // Synchronize internal days state to parent onChange string
  const updateDaysAndSync = (newDays: ItineraryDay[], newTitle?: string) => {
    setDays(newDays);
    const titleToUse = newTitle !== undefined ? newTitle : titleHeader;
    const generatedText = structuredToText(newDays, titleToUse);
    onChange(generatedText);
  };

  const handleSwitchTab = (tab: 'table' | 'text') => {
    if (tab === 'table') {
      // Re-parse current text into structured days
      const parsed = textToStructured(value);
      setTitleHeader(parsed.title);
      if (parsed.days.length > 0) {
        setDays(parsed.days);
      }
    } else {
      // Switching to text: generate text from current days
      const txt = structuredToText(days, titleHeader);
      onChange(txt);
    }
    setActiveTab(tab);
  };

  // Day manipulations
  const handleAddDay = () => {
    const nextIndex = days.length;
    let nextLabel = `Hari ${nextIndex}`;
    if (nextIndex === 0) nextLabel = 'Hari 0 (H-1)';
    else if (nextIndex === 1 && !days.some((d) => d.hariLabel.includes('Hari 1'))) nextLabel = 'Hari 1';

    const newDay: ItineraryDay = {
      id: generateId(),
      hariLabel: nextLabel,
      tanggal: '',
      items: [
        {
          id: generateId(),
          jamMulai: '08.00',
          jamSelesai: '10.00',
          keterangan: 'Aktivitas baru',
        },
      ],
    };
    updateDaysAndSync([...days, newDay]);
  };

  const handleRemoveDay = (dayId: string) => {
    const filtered = days.filter((d) => d.id !== dayId);
    updateDaysAndSync(filtered);
  };

  const handleDayFieldChange = (dayId: string, field: 'hariLabel' | 'tanggal', val: string) => {
    const updated = days.map((d) => (d.id === dayId ? { ...d, [field]: val } : d));
    updateDaysAndSync(updated);
  };

  // Item manipulations
  const handleAddItem = (dayId: string) => {
    const updated = days.map((d) => {
      if (d.id === dayId) {
        const lastItem = d.items[d.items.length - 1];
        let nextStart = '12.00';
        if (lastItem && lastItem.jamSelesai && lastItem.jamSelesai !== 'selesai') {
          nextStart = lastItem.jamSelesai;
        }
        return {
          ...d,
          items: [
            ...d.items,
            {
              id: generateId(),
              jamMulai: nextStart,
              jamSelesai: '',
              keterangan: '',
            },
          ],
        };
      }
      return d;
    });
    updateDaysAndSync(updated);
  };

  const handleRemoveItem = (dayId: string, itemId: string) => {
    const updated = days.map((d) => {
      if (d.id === dayId) {
        return {
          ...d,
          items: d.items.filter((item) => item.id !== itemId),
        };
      }
      return d;
    });
    updateDaysAndSync(updated);
  };

  const handleItemFieldChange = (
    dayId: string,
    itemId: string,
    field: 'jamMulai' | 'jamSelesai' | 'keterangan',
    val: string
  ) => {
    const updated = days.map((d) => {
      if (d.id === dayId) {
        return {
          ...d,
          items: d.items.map((item) =>
            item.id === itemId ? { ...item, [field]: val } : item
          ),
        };
      }
      return d;
    });
    updateDaysAndSync(updated);
  };

  const handleResetToDefaultTemplate = () => {
    const defaultDays = generateDefaultStructuredDays(
      namaGunung,
      jalur,
      tanggalMulai,
      tanggalSelesai
    );
    const cleanTitle = namaGunung ? `🗓️ ITINERARY PENDAKIAN ${namaGunung.toUpperCase()} ${jalur ? jalur.toUpperCase() : ''}`.trim() : '';
    setTitleHeader(cleanTitle);
    updateDaysAndSync(defaultDays, cleanTitle);
    const dayCount = defaultDays.filter(d => !d.hariLabel.includes('Hari 0')).length;
    if (onShowToast) onShowToast(`Jadwal Hari 0 s/d Hari ${dayCount} berhasil disesuaikan otomatis!`);
  };

  const handleCopyText = async () => {
    try {
      const textToCopy = activeTab === 'text' ? value : structuredToText(days, titleHeader);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (onShowToast) onShowToast('Teks itinerary tersalin ke clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (onShowToast) onShowToast('Gagal menyalin');
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#275d1d]/20">
        <div className="flex items-center gap-1.5 bg-[#d1d1d1] p-1 rounded-lg border border-[#275d1d]/30 self-start">
          <button
            type="button"
            onClick={() => handleSwitchTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-[#275d1d] text-white shadow-sm'
                : 'text-gray-800 hover:text-black'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Mode Kolom & Tabel (Mudah)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[#275d1d] text-white shadow-sm'
                : 'text-gray-800 hover:text-black'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Mode Teks Manual</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefaultTemplate}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded bg-white text-[#275d1d] hover:bg-gray-100 border border-[#275d1d] transition-colors cursor-pointer"
            title="Muat ulang contoh format H-1 otomatis sesuai tanggal trip"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format Otomatis H-1</span>
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded bg-[#d1d1d1] text-gray-900 hover:bg-[#c4c4c4] border border-[#275d1d]/30 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#275d1d]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Table & Columns Input Builder */}
      {activeTab === 'table' ? (
        <div className="space-y-4">
          <div className="text-[11px] text-gray-800 bg-[#275d1d]/10 px-3 py-2 rounded-lg border border-[#275d1d]/30 flex items-center justify-between flex-wrap gap-2">
            <span>
              💡 Masukkan data pada kolom <strong>Hari</strong>, <strong>Tanggal</strong>, lalu tambahkan baris <strong>Jam Mulai - Jam Selesai : Keterangan</strong>. Hasil format teks akan terbuat otomatis.
            </span>
            {!hidePreviewText && (
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[#275d1d] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{showPreview ? 'Sembunyikan Preview' : 'Lihat Hasil Format'}</span>
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Days Cards Container */}
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {days.map((day, dIdx) => (
              <div
                key={day.id}
                style={{ zIndex: 100 - dIdx }}
                className="bg-white border-2 border-[#275d1d]/40 rounded-xl shadow-xs hover:border-[#275d1d] transition-colors relative"
              >
                {/* Header Bar: Kolom Hari | Tanggal */}
                <div className="bg-[#275d1d]/10 px-3.5 py-2.5 border-b border-[#275d1d]/30 rounded-t-[10px] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2 flex-1">
                    {/* Kolom Hari */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                        Hari:
                      </span>
                      <input
                        type="text"
                        value={day.hariLabel}
                        onChange={(e) => handleDayFieldChange(day.id, 'hariLabel', e.target.value)}
                        placeholder="Hari 0 (H-1) / Hari 1"
                        className="w-36 sm:w-40 bg-white border border-[#275d1d]/50 rounded px-2.5 py-1 text-xs font-extrabold text-[#275d1d] focus:border-[#275d1d] focus:ring-1 focus:ring-[#275d1d] focus:outline-none"
                      />
                    </div>

                    <span className="text-gray-400 hidden sm:inline">|</span>

                    {/* Kolom Tanggal */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                      <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#275d1d]" /> Tanggal:
                      </span>
                      <input
                        type="text"
                        value={day.tanggal}
                        onChange={(e) => handleDayFieldChange(day.id, 'tanggal', e.target.value)}
                        placeholder="Contoh: 22 September 2026"
                        className="flex-1 bg-white border border-[#275d1d]/50 rounded px-2.5 py-1 text-xs text-gray-900 font-semibold focus:border-[#275d1d] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Day Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(day.id)}
                      title="Hapus Hari ini"
                      className="p-1 text-gray-600 hover:text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-tabel Kolom Jam | Jam | Keterangan */}
                <div className="p-3 sm:p-3.5 space-y-2">
                  {/* Table Column Headers */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-700 px-1">
                    <div className="col-span-3 sm:col-span-2 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#275d1d]" /> Jam Mulai
                    </div>
                    <div className="col-span-3 sm:col-span-2">Jam Selesai</div>
                    <div className="col-span-5 sm:col-span-7">Keterangan Kegiatan</div>
                    <div className="col-span-1 text-center">Aksi</div>
                  </div>

                  {/* Activity Rows */}
                  <div className="space-y-1.5">
                    {day.items.map((item, iIdx) => (
                      <div
                        key={item.id}
                        style={{ zIndex: 40 - iIdx }}
                        className="relative grid grid-cols-12 gap-2 items-center bg-[#f7f7f7] p-1.5 rounded-lg border border-[#d1d1d1] hover:border-[#275d1d]/40"
                      >
                        {/* Jam Mulai with Dropdown */}
                        <div className="col-span-3 sm:col-span-2">
                          <TimeDropdown
                            value={item.jamMulai}
                            onChange={(val) =>
                              handleItemFieldChange(day.id, item.id, 'jamMulai', val)
                            }
                            placeholder="00.00"
                          />
                        </div>

                        {/* Jam Selesai with Dropdown */}
                        <div className="col-span-3 sm:col-span-2">
                          <TimeDropdown
                            value={item.jamSelesai}
                            onChange={(val) =>
                              handleItemFieldChange(day.id, item.id, 'jamSelesai', val)
                            }
                            placeholder="00.00"
                            isEndTime={true}
                          />
                        </div>

                        {/* Keterangan */}
                        <div className="col-span-5 sm:col-span-7">
                          <input
                            type="text"
                            value={item.keterangan}
                            onChange={(e) =>
                              handleItemFieldChange(day.id, item.id, 'keterangan', e.target.value)
                            }
                            placeholder="Kumpul di meeting point..."
                            className="w-full bg-white border border-[#275d1d]/40 rounded px-2.5 py-1 text-xs text-gray-900 focus:border-[#275d1d] focus:outline-none"
                          />
                        </div>

                        {/* Delete Row Button */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(day.id, item.id)}
                            className="p-1 text-gray-500 hover:text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                            title="Hapus baris kegiatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Row Button inside Day */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleAddItem(day.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-[#275d1d] border border-[#275d1d] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Jam / Kegiatan</span>
                    </button>
                    <span className="text-[10px] text-gray-600 font-medium">
                      {day.items.length} aktivitas terdaftar
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Day Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleAddDay}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[#275d1d] hover:bg-[#275d1d]/10 bg-white text-xs font-bold text-[#275d1d] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Hari Berikutnya</span>
            </button>
          </div>
        </div>
      ) : (
        /* MODE 2: Raw Textarea Mode */
        <div className="space-y-2">
          <p className="text-[11px] text-gray-700">
            Mode teks manual memungkinkan Anda mengedit atau menempel (paste) rundown secara bebas. Ketika berpindah kembali ke Mode Kolom, format akan tersinkronisasi otomatis.
          </p>
          <textarea
            rows={10}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Hari 0 (H-1) - 22 September 2026:&#10;• 19.00 - 21.00 : Kumpul di meeting point&#10;• 21.00 - selesai : Perjalanan malam menuju basecamp"
            className="w-full bg-white border border-[#275d1d]/40 rounded-lg p-3 text-xs sm:text-sm font-mono text-gray-900 leading-relaxed focus:border-[#275d1d] focus:outline-none"
          />
        </div>
      )}

      {/* Live Preview Dropdown / Panel */}
      {!hidePreviewText && (showPreview || activeTab === 'table') && (
        <div className="bg-[#f7f7f7] border border-[#275d1d]/30 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-800 font-bold">
            <span className="flex items-center gap-1.5 text-[#275d1d]">
              <FileText className="w-3.5 h-3.5" /> Hasil Teks Siap Export & Media Sosial:
            </span>
            <span className="text-[10px] text-gray-600 font-normal">
              Format: Hari X - Tanggal : • Jam - Jam : Keterangan
            </span>
          </div>
          <pre className="text-[11px] sm:text-xs font-mono text-gray-900 bg-white p-2.5 rounded border border-[#275d1d]/30 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            {activeTab === 'table' ? structuredToText(days, titleHeader) : value}
          </pre>
        </div>
      )}
    </div>
  );
};
