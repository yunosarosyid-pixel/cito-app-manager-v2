import jsPDF from 'jspdf';
import { Trip } from '../types';
import { formatDateRange, getAllTripSchedules } from './formatters';

export function exportTripPDF(trip: Trip): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header Banner
  doc.setFillColor(22, 36, 27); // #16241B
  doc.rect(0, 0, pageW, 100, 'F');

  // Brand text
  doc.setTextColor(226, 168, 59); // #E2A83B
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CITO ADVENTURE MADIUN · ARSIP TRIP RESMI', margin, 32);

  // Title: Gunung + MDPL
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  const mtnTitle = `${trip.nama_gunung.toUpperCase()} ${trip.ketinggian_mdpl ? trip.ketinggian_mdpl.toUpperCase() : ''}`.trim();
  doc.text(mtnTitle, margin, 58);

  // Jalur & Status
  doc.setTextColor(226, 168, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${trip.jalur.toUpperCase()}   |   Status: ${trip.status}`, margin, 80);

  y = 124;

  function sectionHeader(title: string) {
    if (y > 740) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 36, 27);
    doc.text(title, margin, y);
    y += 4;
    doc.setDrawColor(201, 194, 172);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
  }

  function addParagraph(text: string, indent = 0) {
    const lines = doc.splitTextToSize(text, pageW - margin * 2 - indent);
    lines.forEach((line: string) => {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + indent, y);
      y += 13;
    });
  }

  // 1. Detail Trip
  sectionHeader('INFORMASI UMUM');
  const allSchedules = getAllTripSchedules(trip);
  const kuotaStr = trip.min_peserta && trip.max_peserta
    ? `${trip.min_peserta} – ${trip.max_peserta} Pax`
    : (trip.min_peserta ? `Min ${trip.min_peserta} Pax` : (trip.max_peserta ? `Maks ${trip.max_peserta} Pax` : '-'));

  if (allSchedules.length > 1) {
    addParagraph(`• Pilihan Tanggal Pelaksanaan (${allSchedules.length} Pilihan Tanggal):`);
    allSchedules.forEach((sch, i) => {
      let label = sch.label || `Jadwal ${i + 1}`;
      if (label.startsWith('Gelombang')) {
        label = label.replace('Gelombang', 'Jadwal');
      }
      const schDate = formatDateRange(sch.tanggal_mulai, sch.tanggal_selesai);
      const schDurasi = sch.durasi || trip.durasi || '2 Hari 1 Malam';
      addParagraph(`  - ${label}: ${schDate} (${schDurasi})`, 10);
    });
  } else {
    const dateRange = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai) || 'Jadwal Terbuka';
    addParagraph(`• Tanggal Pelaksanaan : ${dateRange}`);
    addParagraph(`• Durasi Pendakian    : ${trip.durasi || '2 Hari 1 Malam'}`);
  }
  addParagraph(`• Target Peserta      : ${kuotaStr}`);
  addParagraph(`  (Catatan: Jika kuota peserta kurang, akan ada penyesuaian harga / sharing cost)`);
  y += 6;

  // 2. Meeting Point
  if (trip.harga_mepo && trip.harga_mepo.length > 0) {
    sectionHeader('TARIF PER MEETING POINT (MEPO)');
    trip.harga_mepo.forEach(m => {
      if (m.lokasi || m.harga) {
        addParagraph(`• ${m.lokasi || 'Meeting Point'} : ${m.harga || '-'}`);
      }
    });
    y += 6;
  }

  // 3. Include & Exclude
  sectionHeader('FASILITAS INCLUDE & EXCLUDE');
  doc.setFont('helvetica', 'bold');
  doc.text('Include (Termasuk):', margin, y);
  y += 13;
  doc.setFont('helvetica', 'normal');
  (trip.include || []).forEach(item => {
    addParagraph(`[v] ${item}`, 10);
  });
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Exclude (Tidak Termasuk):', margin, y);
  y += 13;
  doc.setFont('helvetica', 'normal');
  (trip.exclude || []).forEach(item => {
    addParagraph(`[x] ${item}`, 10);
  });
  if (trip.extra_porter) {
    addParagraph(`[*] Extra Porter Pribadi: ${trip.extra_porter}`, 10);
  }
  y += 6;

  // 4. Itinerary
  if (trip.itinerary) {
    sectionHeader('ITINERARY & RUNDOWN KEGIATAN');
    const itinLines = trip.itinerary.split('\n');
    itinLines.forEach(l => {
      if (l.trim()) {
        addParagraph(l);
      } else {
        y += 6;
      }
    });
    y += 6;
  }

  // 5. S&K Berlaku
  if (trip.sk_berlaku && trip.sk_berlaku.length > 0) {
    sectionHeader('SYARAT & KETENTUAN (S&K)');
    trip.sk_berlaku.forEach(sk => {
      addParagraph(`• ${sk}`);
    });
    y += 6;
  }

  // 6. Catatan Penting
  if (trip.catatan_penting) {
    sectionHeader('CATATAN PENTING');
    addParagraph(trip.catatan_penting);
    y += 6;
  }

  // 7. Kontak
  sectionHeader('KONTAK INFORMASI & BOOKING');
  addParagraph(`• WhatsApp  : ${trip.kontak_wa || '+6282230444428'}`);
  addParagraph(`• Instagram : ${trip.kontak_ig || 'Cito Adventure Madiun'}`);

  const filename = `arsip-trip-${trip.nama_gunung.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${trip.jalur.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
  doc.save(filename);
}

export function exportTripTXT(trip: Trip): void {
  const allSchedules = getAllTripSchedules(trip);
  const jadwalTxt = allSchedules.length > 1
    ? `PILIHAN TANGGAL PELAKSANAAN:\n${allSchedules.map((s, i) => `- ${s.label || `Batch ${i + 1}`}: ${formatDateRange(s.tanggal_mulai, s.tanggal_selesai)} (${s.durasi || trip.durasi})`).join('\n')}`
    : `TANGGAL  : ${formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai)}\nDURASI   : ${trip.durasi}`;

  const content = `=====================================================
CITO ADVENTURE MADIUN · ARSIP RESMI OPEN TRIP
=====================================================
GUNUNG   : ${trip.nama_gunung.toUpperCase()} ${trip.ketinggian_mdpl || ''}
JALUR    : ${trip.jalur.toUpperCase()}
STATUS   : ${trip.status}

${jadwalTxt}
KUOTA    : ${trip.min_peserta || '-'} - ${trip.max_peserta || '-'} pax
CATATAN  : Jika peserta kurang, akan ada penyesuaian harga

TARIF MEETING POINT:
${(trip.harga_mepo || []).map(m => `- ${m.lokasi}: ${m.harga}`).join('\n')}

FASILITAS INCLUDE:
${(trip.include || []).map(i => `[v] ${i}`).join('\n')}

EXCLUDE:
${(trip.exclude || []).map(e => `[x] ${e}`).join('\n')}
${trip.extra_porter ? `Extra Porter: ${trip.extra_porter}` : ''}

ITINERARY:
${trip.itinerary || '-'}

SYARAT & KETENTUAN:
${(trip.sk_berlaku || []).map(s => `- ${s}`).join('\n')}

CATATAN PENTING:
${trip.catatan_penting || '-'}

KONTAK:
WhatsApp  : ${trip.kontak_wa || '-'}
Instagram : ${trip.kontak_ig || '-'}
=====================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arsip-${trip.nama_gunung.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${trip.jalur.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
