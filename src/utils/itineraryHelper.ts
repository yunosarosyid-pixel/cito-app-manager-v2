/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatDateID } from './formatters';

export interface ItineraryItem {
  id: string;
  jamMulai: string;   // e.g. "19.00"
  jamSelesai: string; // e.g. "21.00" or "selesai"
  keterangan: string; // e.g. "Kumpul di meeting point"
}

export interface ItineraryDay {
  id: string;
  hariLabel: string;  // e.g. "Hari 0 (H-1)", "Hari 1", "Hari 2"
  tanggal: string;    // e.g. "22 September 2026"
  items: ItineraryItem[];
}

/**
 * Generate a unique ID for days and items
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Convert structured days into standard Itinerary text format:
 * 
 * Hari 0 (H-1) - 22 September 2026:
 * • 19.00 - 21.00 : Kumpul di meeting point
 */
export function structuredToText(days: ItineraryDay[], title?: string): string {
  const parts: string[] = [];

  if (title && title.trim()) {
    parts.push(title.trim());
    parts.push('');
  }

  days.forEach((day, index) => {
    const hariPart = day.hariLabel.trim() || `Hari ${index}`;
    const tglPart = day.tanggal.trim();
    const dayHeader = tglPart ? `${hariPart} - ${tglPart}:` : `${hariPart}:`;

    const itemLines = (day.items || [])
      .filter((item) => item.keterangan.trim() || item.jamMulai.trim())
      .map((item) => {
        const mulai = item.jamMulai.trim();
        const selesai = item.jamSelesai.trim();
        const ket = item.keterangan.trim();

        let timePart = '';
        if (mulai && selesai) {
          timePart = `${mulai} - ${selesai} : `;
        } else if (mulai) {
          timePart = `${mulai} : `;
        } else if (selesai) {
          timePart = `${selesai} : `;
        }

        return `• ${timePart}${ket}`;
      });

    parts.push(dayHeader);
    if (itemLines.length > 0) {
      parts.push(...itemLines);
    }
    parts.push(''); // blank line between days
  });

  return parts.join('\n').trim();
}

/**
 * Parse raw itinerary text into structured ItineraryDay[]
 */
export function textToStructured(rawText: string): { title: string; days: ItineraryDay[] } {
  if (!rawText || !rawText.trim()) {
    return { title: '', days: [] };
  }

  const lines = rawText.split('\n').map((l) => l.trim());
  let title = '';
  const days: ItineraryDay[] = [];
  let currentDay: ItineraryDay | null = null;

  // Regex to detect day header like: "Hari 0 (H-1) - 22 September 2026:" or "Hari 1 - 23 September 2026:" or "Hari 1:"
  const dayHeaderRegex = /^(Hari\s*[^:\n\-–]+)(?:[\-–—]\s*([^:\n]+))?:?/i;
  // Regex to detect activity line with hours like:
  // "• 19.00 - 21.00 : Kumpul di meeting point" or "- 19:00 - selesai: Kumpul"
  const itemRegex = /^[\s•\-\*]*(\d{1,2}[:.]\d{2})\s*(?:[\-–—]\s*(\d{1,2}[:.]\d{2}|selesai))?\s*[:\s–\-]+\s*(.+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Check if line is title at the very beginning (e.g. 🗓️ ITINERARY PENDAKIAN ...)
    if (days.length === 0 && !currentDay && (line.startsWith('🗓') || line.toUpperCase().includes('ITINERARY PENDAKIAN'))) {
      title = line;
      continue;
    }

    const headerMatch = line.match(dayHeaderRegex);
    if (headerMatch && headerMatch[1].toLowerCase().startsWith('hari')) {
      if (currentDay) {
        days.push(currentDay);
      }
      currentDay = {
        id: generateId(),
        hariLabel: headerMatch[1].trim(),
        tanggal: (headerMatch[2] || '').trim().replace(/:$/, ''),
        items: [],
      };
      continue;
    }

    // It's an activity inside the day
    if (currentDay) {
      const itemMatch = line.match(itemRegex);
      if (itemMatch) {
        currentDay.items.push({
          id: generateId(),
          jamMulai: itemMatch[1].replace(':', '.'),
          jamSelesai: (itemMatch[2] || '').replace(':', '.'),
          keterangan: itemMatch[3].trim(),
        });
      } else {
        // Fallback for lines without strict time format
        const cleanLine = line.replace(/^[\s•\-\*]+/, '').trim();
        currentDay.items.push({
          id: generateId(),
          jamMulai: '',
          jamSelesai: '',
          keterangan: cleanLine,
        });
      }
    } else {
      // Line before any "Hari" found
      if (!title) {
        title = line;
      }
    }
  }

  if (currentDay) {
    days.push(currentDay);
  }

  return { title, days };
}

/**
 * Generate default structured days based on trip start & end dates dynamically
 */
export function generateDefaultStructuredDays(
  namaGunung: string,
  jalur: string,
  startDateStr?: string,
  endDateStr?: string
): ItineraryDay[] {
  const cleanMtn = namaGunung ? namaGunung.replace(/^Gunung\s+/i, '') : 'Gunung';
  
  let hMinus1Str = '';
  let day1Date: Date | null = null;
  let totalDays = 2; // Default 2 hari

  if (startDateStr) {
    const sDate = new Date(startDateStr);
    day1Date = new Date(sDate);
    const hMinus1 = new Date(sDate);
    hMinus1.setDate(hMinus1.getDate() - 1);
    hMinus1Str = formatDateID(hMinus1.toISOString().split('T')[0]);

    if (endDateStr) {
      const eDate = new Date(endDateStr);
      const diffTime = eDate.getTime() - sDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      totalDays = Math.max(1, diffDays + 1);
    }
  }

  const result: ItineraryDay[] = [
    {
      id: generateId(),
      hariLabel: 'Hari 0 (H-1)',
      tanggal: hMinus1Str,
      items: [
        {
          id: generateId(),
          jamMulai: '19.00',
          jamSelesai: '21.00',
          keterangan: 'Kumpul di meeting point (penjemputan peserta)',
        },
        {
          id: generateId(),
          jamMulai: '21.00',
          jamSelesai: 'selesai',
          keterangan: 'Perjalanan malam menuju basecamp',
        },
      ],
    },
  ];

  for (let d = 1; d <= totalDays; d++) {
    let dayDateStr = '';
    if (day1Date) {
      const curr = new Date(day1Date);
      curr.setDate(curr.getDate() + (d - 1));
      dayDateStr = formatDateID(curr.toISOString().split('T')[0]);
    }

    let items: ItineraryItem[] = [];

    if (totalDays === 1) {
      // Tek-tok / 1 hari
      items = [
        { id: generateId(), jamMulai: '02.00', jamSelesai: '04.30', keterangan: 'Tiba di basecamp, istirahat & briefing' },
        { id: generateId(), jamMulai: '05.00', jamSelesai: '11.00', keterangan: `Start pendakian menuju Puncak ${cleanMtn}` },
        { id: generateId(), jamMulai: '11.00', jamSelesai: '13.00', keterangan: `Puncak ${cleanMtn}, foto & makan siang` },
        { id: generateId(), jamMulai: '13.30', jamSelesai: '17.30', keterangan: 'Perjalanan turun kembali ke basecamp' },
        { id: generateId(), jamMulai: '18.00', jamSelesai: 'selesai', keterangan: 'Bersih-bersih & perjalanan pulang' },
      ];
    } else if (totalDays === 2) {
      if (d === 1) {
        items = [
          { id: generateId(), jamMulai: '07.00', jamSelesai: '09.00', keterangan: 'Tiba di basecamp, istirahat, sarapan & briefing' },
          { id: generateId(), jamMulai: '09.30', jamSelesai: '15.30', keterangan: 'Mulai pendakian menuju area camp' },
          { id: generateId(), jamMulai: '16.00', jamSelesai: '18.00', keterangan: 'Pasang tenda & nikmati sunset' },
          { id: generateId(), jamMulai: '19.00', jamSelesai: '21.00', keterangan: 'Makan malam hangat bersama & istirahat' },
        ];
      } else {
        items = [
          { id: generateId(), jamMulai: '03.00', jamSelesai: '06.00', keterangan: 'Summit attack berburu sunrise' },
          { id: generateId(), jamMulai: '06.00', jamSelesai: '08.00', keterangan: `Puncak ${cleanMtn}, selebrasi & sesi foto dokumentasi` },
          { id: generateId(), jamMulai: '08.30', jamSelesai: '10.30', keterangan: 'Turun kembali ke camp area & sarapan' },
          { id: generateId(), jamMulai: '11.30', jamSelesai: '15.00', keterangan: 'Perjalanan turun ke basecamp' },
          { id: generateId(), jamMulai: '15.30', jamSelesai: '17.00', keterangan: 'Bersih-bersih & persiapan pulang' },
          { id: generateId(), jamMulai: '17.00', jamSelesai: 'selesai', keterangan: 'Perjalanan kembali ke meeting point masing-masing' },
        ];
      }
    } else {
      // Multi-hari (3 hari, 4 hari, 5 hari, dst.)
      if (d === 1) {
        items = [
          { id: generateId(), jamMulai: '07.00', jamSelesai: '09.00', keterangan: 'Tiba di basecamp, istirahat, sarapan & briefing' },
          { id: generateId(), jamMulai: '09.30', jamSelesai: '15.30', keterangan: 'Mulai pendakian hari ke-1 menuju Camp 1' },
          { id: generateId(), jamMulai: '16.00', jamSelesai: '18.00', keterangan: 'Mendirikan tenda tim Camp 1' },
          { id: generateId(), jamMulai: '19.00', jamSelesai: '21.00', keterangan: 'Makan malam bersama & istirahat' },
        ];
      } else if (d === totalDays) {
        // Hari Terakhir
        items = [
          { id: generateId(), jamMulai: '06.00', jamSelesai: '08.00', keterangan: 'Bangun pagi, sarapan & packing turun' },
          { id: generateId(), jamMulai: '08.30', jamSelesai: '14.00', keterangan: 'Perjalanan turun kembali ke Basecamp' },
          { id: generateId(), jamMulai: '14.30', jamSelesai: '17.00', keterangan: 'Tiba di Basecamp, bersih-bersih & makan bersama' },
          { id: generateId(), jamMulai: '17.30', jamSelesai: 'selesai', keterangan: 'Perjalanan pulang ke meeting point kota masing-masing' },
        ];
      } else if (d === totalDays - 1) {
        // Hari Summit Attack
        items = [
          { id: generateId(), jamMulai: '02.30', jamSelesai: '05.30', keterangan: 'Bangun pagi & Summit attack menuju Puncak' },
          { id: generateId(), jamMulai: '05.30', jamSelesai: '08.00', keterangan: `Golden Sunrise di Puncak ${cleanMtn} & selebrasi` },
          { id: generateId(), jamMulai: '08.30', jamSelesai: '11.00', keterangan: 'Turun kembali ke camp area tenda' },
          { id: generateId(), jamMulai: '12.00', jamSelesai: '14.00', keterangan: 'Makan siang & istirahat pemulihan tenaga' },
          { id: generateId(), jamMulai: '18.30', jamSelesai: '21.00', keterangan: 'Makan malam keakraban & istirahat malam' },
        ];
      } else {
        // Hari Penjelajahan / Trekking lanjutan (Hari 2, 3...)
        items = [
          { id: generateId(), jamMulai: '06.30', jamSelesai: '08.00', keterangan: 'Sarapan pagi santai & packing tenda' },
          { id: generateId(), jamMulai: '08.30', jamSelesai: '14.30', keterangan: `Trekking lanjutan menuju Camp ${d} (aklimatisasi)` },
          { id: generateId(), jamMulai: '15.00', jamSelesai: '18.00', keterangan: `Mendirikan tenda tim Camp ${d} & dokumentasi sore` },
          { id: generateId(), jamMulai: '19.00', jamSelesai: '21.00', keterangan: 'Makan malam hangat bersama tim Cito' },
        ];
      }
    }

    result.push({
      id: generateId(),
      hariLabel: `Hari ${d}`,
      tanggal: dayDateStr,
      items,
    });
  }

  return result;
}
