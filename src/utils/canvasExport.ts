import { Trip } from '../types';
import { formatDateRange, getAllTripSchedules, getBasecampStartPrice } from './formatters';
import { getCustomLogo, OFFICIAL_LOGO_URL } from './storage';
import {
  drawWhatsAppIcon,
  drawInstagramIcon,
  drawTikTokLiveIcon,
  drawCalendarDurationIcon,
  drawGroupPesertaIcon,
  drawYukGasssGraphic,
  drawFacilityIncludeIcon,
  drawWhiteExcludeCrossCircleIcon,
  drawWhiteCheckCircleIcon,
} from './canvasIcons';
import JSZip from 'jszip';

export type SlideType = 'cover' | 'facilities' | 'itinerary' | 'notes' | 'contact' | 'random_photo';

export interface SlideOption {
  id: SlideType;
  title: string;
  subtitle: string;
}

export const SLIDES_LIST: SlideOption[] = [
  { id: 'cover', title: 'Slide 1: Cover Trip', subtitle: 'Judul, jalur, harga mulai, mepo & booking bar' },
  { id: 'facilities', title: 'Slide 2: Fasilitas & S&K', subtitle: 'Include, Exclude, Porter, dan Syarat Ketentuan' },
  { id: 'itinerary', title: 'Slide 3: Itinerary Rundown', subtitle: 'Jadwal kegiatan terstruktur per hari' },
  { id: 'notes', title: 'Slide 4: Catatan Penting', subtitle: 'Persiapan fisik dan peringatan olahraga' },
  { id: 'contact', title: 'Slide 5: Info Lebih Lanjut', subtitle: 'Kontak WhatsApp, Instagram & Live Streaming Cito' },
  { id: 'random_photo', title: 'Slide 6: Random Foto', subtitle: 'Foto dokumentasi/jalur bebas & watermark booking bawah' },
];

export interface PresetBackground {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
}

export const PRESET_BACKGROUNDS: PresetBackground[] = [
  {
    id: 'sindoro',
    name: 'Sindoro Asli (Default)',
    url: '/default-bg.jpg',
    icon: '🏔️',
    description: 'Foto padang sabana Gunung Sindoro resmi Cito Adventure',
  },
  {
    id: 'transparent',
    name: 'Transparan (PNG Alpha)',
    url: 'transparent',
    icon: '✨',
    description: 'Tanpa background, siap tempel di Canva, Photoshop, atau video',
  },
  {
    id: 'grad_emerald',
    name: 'Gradasi Emerald Forest',
    url: 'gradient:emerald',
    icon: '🌲',
    description: 'Nuansa hutan pinus hijau tua khas Cito Adventure',
  },
  {
    id: 'grad_midnight',
    name: 'Gradasi Midnight Alpine',
    url: 'gradient:midnight',
    icon: '🌌',
    description: 'Nuansa malam dingin pendakian di bawah bintang',
  },
  {
    id: 'grad_sunset',
    name: 'Gradasi Sunset Warm',
    url: 'gradient:sunset',
    icon: '🌅',
    description: 'Nuansa senja hangat keemasan di atas awan',
  },
];

// Helper to safely load images
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: try without crossOrigin or reject
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = (e) => reject(e);
      fallback.src = src;
    };
    img.src = src;
  });
}

// Draw image covering the entire canvas (CSS object-fit: cover)
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let renderW = w;
  let renderH = h;
  let offsetX = x;
  let offsetY = y;

  if (imgRatio > canvasRatio) {
    renderW = h * imgRatio;
    offsetX = x - (renderW - w) / 2;
  } else {
    renderH = w / imgRatio;
    offsetY = y - (renderH - h) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = true,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' = 'left'
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      if (align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(line.trim(), x, currentY);
        ctx.textAlign = 'left';
      } else {
        ctx.fillText(line.trim(), x, currentY);
      }
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (align === 'center') {
    ctx.textAlign = 'center';
    ctx.fillText(line.trim(), x, currentY);
    ctx.textAlign = 'left';
  } else {
    ctx.fillText(line.trim(), x, currentY);
  }
  return currentY + lineHeight;
}

// Draw Floating Bottom Booking Bar — precise proportional spec version:
// Circular orange arrow icon on far left, bold "BOOKING NOW", WhatsApp icons with two-line text,
// Instagram icon with handle. All set in Poppins Bold/Black, ALL CAPS.
// Automatically scaled to fit within a floating pill with safe margins on 1080px canvas so nothing clips.
function drawBottomBookingBar(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  trip: Trip
) {
  const FONT_FAMILY = '"Poppins", "Montserrat", sans-serif';

  // Floating pill layout bounds
  const barMarginX = 42; // Clean margin from canvas left and right edges
  const targetMaxBarW = canvasW - barMarginX * 2; // e.g. 996px on 1080px canvas
  const barH = 72;
  const radius = barH / 2;

  // Data strings (ALL CAPS as spec requires)
  const waJatim = (trip.kontak_wa_jatim || '+6282230444428').toUpperCase();
  const waJakarta = (trip.kontak_wa_jakarta || '+6289503689266').toUpperCase();
  const rawIg = (trip.kontak_ig || 'CITO ADVENTURE MADIUN').replace(/^@/, '').toUpperCase().replace(/\s+/g, '');
  const cleanIgDisplay = `@${rawIg}`;

  // Base specifications designed for comfortable fit
  const BASE_BOOKING_PX = 21;
  const BASE_LABEL_PX = 9.5;
  const BASE_VALUE_PX = 17;
  const BASE_ICON_SIZE = 28;
  const BASE_ICON_GAP = 8;
  const BASE_CIRCLE_R = 25;
  const BASE_GAP_ARROW = 28;
  const BASE_GAP_TEXT_WA = 28;
  const BASE_GAP_WA_WA = 18;
  const BASE_GAP_WA_IG = 18;
  const leftPad = 14;
  const rightPad = 22;

  // Measure base dimensions
  ctx.save();
  ctx.font = `800 ${BASE_BOOKING_PX}px ${FONT_FAMILY}`;
  const rawBookingW = ctx.measureText('BOOKING NOW').width;

  ctx.font = `800 ${BASE_VALUE_PX}px ${FONT_FAMILY}`;
  const rawWa1ValW = ctx.measureText(waJatim).width;
  const rawWa2ValW = ctx.measureText(waJakarta).width;
  const rawIgValW = ctx.measureText(cleanIgDisplay).width;

  ctx.font = `700 ${BASE_LABEL_PX}px ${FONT_FAMILY}`;
  const rawWa1LblW = ctx.measureText('JATIM & JATENG').width;
  const rawWa2LblW = ctx.measureText('JAKARTA & SEKITAR').width;
  ctx.restore();

  const rawWa1TextW = Math.max(rawWa1ValW, rawWa1LblW);
  const rawWa2TextW = Math.max(rawWa2ValW, rawWa2LblW);

  const rawWa1BlockW = BASE_ICON_SIZE + BASE_ICON_GAP + rawWa1TextW;
  const rawWa2BlockW = BASE_ICON_SIZE + BASE_ICON_GAP + rawWa2TextW;
  const rawIgBlockW = BASE_ICON_SIZE + BASE_ICON_GAP + rawIgValW;

  const rawTotalContentW =
    leftPad +
    BASE_CIRCLE_R * 2 +
    BASE_GAP_ARROW +
    rawBookingW +
    BASE_GAP_TEXT_WA +
    rawWa1BlockW +
    BASE_GAP_WA_WA +
    rawWa2BlockW +
    BASE_GAP_WA_IG +
    rawIgBlockW +
    rightPad;

  // Compute adaptive scale factor so the whole bar never clips and has comfortable breathing room
  const scale = rawTotalContentW > targetMaxBarW ? targetMaxBarW / rawTotalContentW : 1;

  // Scaled dimensions
  const circleRadius = Math.round(BASE_CIRCLE_R * Math.max(scale, 0.85));
  const iconSize = Math.round(BASE_ICON_SIZE * Math.max(scale, 0.85));
  const iconTextGap = Math.round(BASE_ICON_GAP * scale);

  const bookingPx = Math.round(BASE_BOOKING_PX * scale * 10) / 10;
  const labelPx = Math.round(BASE_LABEL_PX * scale * 10) / 10;
  const valuePx = Math.round(BASE_VALUE_PX * scale * 10) / 10;

  const gapArrow = Math.round(BASE_GAP_ARROW * scale);
  const gapTextWa = Math.round(BASE_GAP_TEXT_WA * scale);
  const gapWaWa = Math.round(BASE_GAP_WA_WA * scale);
  const gapWaIg = Math.round(BASE_GAP_WA_IG * scale);

  const BOOKING_FONT = `800 ${bookingPx}px ${FONT_FAMILY}`;
  const LABEL_FONT = `700 ${labelPx}px ${FONT_FAMILY}`;
  const VALUE_FONT = `800 ${valuePx}px ${FONT_FAMILY}`;

  // Remeasure exactly at scaled font size
  ctx.save();
  ctx.font = BOOKING_FONT;
  const bookingW = ctx.measureText('BOOKING NOW').width;

  ctx.font = VALUE_FONT;
  const wa1ValueW = ctx.measureText(waJatim).width;
  const wa2ValueW = ctx.measureText(waJakarta).width;
  const igTextW = ctx.measureText(cleanIgDisplay).width;

  ctx.font = LABEL_FONT;
  const wa1LabelW = ctx.measureText('JATIM & JATENG').width;
  const wa2LabelW = ctx.measureText('JAKARTA & SEKITAR').width;
  ctx.restore();

  const wa1TextW = Math.max(wa1ValueW, wa1LabelW);
  const wa2TextW = Math.max(wa2ValueW, wa2LabelW);
  const wa1BlockW = iconSize + iconTextGap + wa1TextW;
  const wa2BlockW = iconSize + iconTextGap + wa2TextW;
  const igBlockW = iconSize + iconTextGap + igTextW;

  const actualContentW =
    leftPad +
    circleRadius * 2 +
    gapArrow +
    bookingW +
    gapTextWa +
    wa1BlockW +
    gapWaWa +
    wa2BlockW +
    gapWaIg +
    igBlockW +
    rightPad;

  const barW = Math.min(actualContentW, canvasW - 40);
  const barX = (canvasW - barW) / 2;
  const barY = canvasH - barH - 38;
  const centerY = barY + barH / 2;

  // Draw floating white pill with shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, barX, barY, barW, barH, radius, true, false);
  ctx.restore();

  // Layout elements horizontally using running cursor
  let cursorX = barX + leftPad;

  // 1. Circular Amber Arrow on far left
  const circleX = cursorX + circleRadius;
  ctx.save();
  ctx.fillStyle = '#F59E0B'; // Vibrant amber-orange
  ctx.beginPath();
  ctx.arc(circleX, centerY, circleRadius, 0, Math.PI * 2);
  ctx.fill();

  // Vector arrow pointing right
  ctx.fillStyle = '#000000';
  const arrowScale = circleRadius / 28;
  const ax = circleX;
  const ay = centerY;
  ctx.beginPath();
  ctx.moveTo(ax - 13 * arrowScale, ay - 3.5 * arrowScale);
  ctx.lineTo(ax + 2 * arrowScale, ay - 3.5 * arrowScale);
  ctx.lineTo(ax + 2 * arrowScale, ay - 9 * arrowScale);
  ctx.lineTo(ax + 13 * arrowScale, ay);
  ctx.lineTo(ax + 2 * arrowScale, ay + 9 * arrowScale);
  ctx.lineTo(ax + 2 * arrowScale, ay + 3.5 * arrowScale);
  ctx.lineTo(ax - 13 * arrowScale, ay + 3.5 * arrowScale);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  cursorX = circleX + circleRadius;

  // 2. Bold text "BOOKING NOW" — Poppins 800
  cursorX += gapArrow;
  const bookingTextX = cursorX;
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.font = BOOKING_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BOOKING NOW', bookingTextX, centerY);
  ctx.restore();
  cursorX = bookingTextX + bookingW;

  // 3. Section 1: WhatsApp Admin Jatim & Jateng
  cursorX += gapTextWa;
  const wa1BlockX = cursorX;
  const wa1IconCenterX = wa1BlockX + iconSize / 2;
  const wa1TextX = wa1BlockX + iconSize + iconTextGap;

  drawWhatsAppIcon(ctx, wa1IconCenterX, centerY, iconSize, '#16A34A');

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.font = LABEL_FONT;
  ctx.fillText('JATIM & JATENG', wa1TextX, centerY - 11);
  ctx.font = VALUE_FONT;
  ctx.fillText(waJatim, wa1TextX, centerY + 9);
  ctx.restore();
  cursorX = wa1BlockX + wa1BlockW;

  // 4. Section 2: WhatsApp Admin Jakarta & Sekitar
  cursorX += gapWaWa;
  const wa2BlockX = cursorX;
  const wa2IconCenterX = wa2BlockX + iconSize / 2;
  const wa2TextX = wa2BlockX + iconSize + iconTextGap;

  drawWhatsAppIcon(ctx, wa2IconCenterX, centerY, iconSize, '#16A34A');

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.font = LABEL_FONT;
  ctx.fillText('JAKARTA & SEKITAR', wa2TextX, centerY - 11);
  ctx.font = VALUE_FONT;
  ctx.fillText(waJakarta, wa2TextX, centerY + 9);
  ctx.restore();
  cursorX = wa2BlockX + wa2BlockW;

  // 5. Section 3: Instagram Icon + @username text
  cursorX += gapWaIg;
  const igBlockX = cursorX;
  const igIconCenterX = igBlockX + iconSize / 2;
  const igTextX = igBlockX + iconSize + iconTextGap;

  drawInstagramIcon(ctx, igIconCenterX, centerY, iconSize, '#000000');

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.font = VALUE_FONT;
  ctx.fillText(cleanIgDisplay, igTextX, centerY);
  ctx.restore();
}

// Base Canvas Renderer with Background and Dimming Overlay
async function prepareBaseCanvas(
  width: number,
  height: number,
  bgUrl?: string,
  dimRatio: number = 0.2
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Opsi Background Transparan Penuh (PNG Alpha Channel)
  if (bgUrl === 'transparent') {
    ctx.clearRect(0, 0, width, height);
    return { canvas, ctx };
  }

  // 2. Opsi Preset Gradasi Vektor
  if (bgUrl && bgUrl.startsWith('gradient:')) {
    const gradType = bgUrl.replace('gradient:', '');
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (gradType === 'emerald') {
      grad.addColorStop(0, '#062013');
      grad.addColorStop(0.5, '#143823');
      grad.addColorStop(1, '#08170d');
    } else if (gradType === 'midnight') {
      grad.addColorStop(0, '#0B132B');
      grad.addColorStop(0.5, '#1C2541');
      grad.addColorStop(1, '#0A0F1D');
    } else if (gradType === 'sunset') {
      grad.addColorStop(0, '#2D1515');
      grad.addColorStop(0.5, '#4A2810');
      grad.addColorStop(1, '#1A0D0D');
    } else {
      grad.addColorStop(0, '#194220');
      grad.addColorStop(0.5, '#275D1D');
      grad.addColorStop(1, '#0F260C');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // 3. Opsi Foto Gambar (Bawaan atau Upload Pengguna)
    const targetBg = bgUrl || '/default-bg.jpg';
    try {
      const bgImg = await loadImage(targetBg);
      drawImageCover(ctx, bgImg, 0, 0, width, height);
    } catch (err) {
      console.warn('Failed to load custom bg image, rendering fallback gradient', err);
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#194220');
      grad.addColorStop(0.5, '#275D1D');
      grad.addColorStop(1, '#0F260C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Dark Dimming Overlay for contrast
  const effectiveDim = Math.max(0, Math.min(0.8, dimRatio));
  if (effectiveDim > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${effectiveDim})`;
    ctx.fillRect(0, 0, width, height);
  }

  return { canvas, ctx };
}

// ==========================================
// SLIDE 1: COVER (Exactly matching 1.png)
// ==========================================
async function renderCoverSlide(
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.15,
  customLogoUrl?: string
): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = ratio === '4:5' ? 1350 : 1920;
  const { canvas, ctx } = await prepareBaseCanvas(width, height, bgUrl, dimRatio);

  // 1. Top Left: Stylized "Yuk Gasss Mendaki Offline" sticker graphic matching Desain tanpa judul (1).png
  drawYukGasssGraphic(ctx, 115, 100, 1.05);

  // 2. Top Right: Cito Adventure Logo + Text (Supports user uploaded custom logo)
  try {
    const activeLogoUrl = customLogoUrl || trip.logo_url || getCustomLogo() || OFFICIAL_LOGO_URL;
    const logoImg = await loadImage(activeLogoUrl);
    const naturalW = logoImg.naturalWidth || logoImg.width || 1;
    const naturalH = logoImg.naturalHeight || logoImg.height || 1;
    const aspect = naturalW / naturalH;
    const maxDimension = 118;
    const logoW = aspect >= 1 ? maxDimension : maxDimension * aspect;
    const logoH = aspect <= 1 ? maxDimension : maxDimension / aspect;
    const logoX = width - logoW - 70;
    const logoY = 48;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 14;
    ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    ctx.restore();
  } catch (e) {
    console.warn('Could not load logo for cover slide', e);
  }

  // 3. Mountain Title & Jalur (Center)
  const isRatio916 = ratio === '9:16';
  const titleY = isRatio916 ? 440 : 320;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 4;

  const mtnName = (trip.nama_gunung || 'GUNUNG SINDORO').toUpperCase();
  const mtnFullName = mtnName.startsWith('GUNUNG') ? mtnName : `GUNUNG ${mtnName}`;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 66px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mtnFullName, width / 2, titleY);

  const jalurText = (trip.jalur || 'VIA BASECAMP').toUpperCase();
  const fullJalur = jalurText.startsWith('VIA') ? jalurText : `VIA ${jalurText}`;
  ctx.font = '800 38px "Montserrat", "Space Grotesk", sans-serif';
  ctx.fillText(fullJalur, width / 2, titleY + 68);
  ctx.restore();

  // 4. Lower Pricing & Meeting Points Section
  const priceY = isRatio916 ? 1240 : 800;

  // "Start from" label
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 24px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Start from', width / 2, priceY);

  // Price Pill: "IDR 600.000" (Selalu dipatok dari Meeting Point Basecamp)
  const startPrice = getBasecampStartPrice(trip);
  const formattedPrice = startPrice.toLowerCase().includes('idr') || startPrice.toLowerCase().includes('rp')
    ? startPrice.toUpperCase()
    : `IDR ${startPrice}`;

  const pricePillW = 420;
  const pricePillH = 92;
  const pricePillX = (width - pricePillW) / 2;
  const pricePillY = priceY + 22;

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  roundRect(ctx, pricePillX, pricePillY, pricePillW, pricePillH, pricePillH / 2, true, true);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formattedPrice, width / 2, pricePillY + pricePillH / 2);
  ctx.restore();

  // Meeting Points Pill: "Jakarta - Solo - Madiun - Basecamp"
  const mepoList = trip.harga_mepo && trip.harga_mepo.length > 0
    ? trip.harga_mepo.map((m) => m.lokasi || 'Basecamp').join(' - ')
    : 'Jakarta - Solo - Madiun - Basecamp';

  const mepoPillW = Math.min(width - 160, 720);
  const mepoPillH = 60;
  const mepoPillX = (width - mepoPillW) / 2;
  const mepoPillY = pricePillY + pricePillH + 24;

  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  roundRect(ctx, mepoPillX, mepoPillY, mepoPillW, mepoPillH, mepoPillH / 2, true, true);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 22px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mepoList, width / 2, mepoPillY + mepoPillH / 2);
  ctx.restore();

  // 5. Metadata line: Clock + Duration, User + Min Pax
  const metaY = mepoPillY + mepoPillH + 42;
  const durasiText = trip.durasi || '2 Hari 1 Malam';
  const minPaxMadiun = trip.min_peserta || '6';
  const kuotaText = `Min ${minPaxMadiun} Pax Peserta*`;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';

  // Duration: Calendar with clock icon (Matches 4.png)
  const durX = width / 2 - 186;
  drawCalendarDurationIcon(ctx, durX - 18, metaY, 26, '#FFFFFF');
  ctx.font = '800 19px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(durasiText, durX, metaY);

  // Kuota: 3-Person Group silhouette icon (Matches 3.png)
  const paxX = width / 2 + 46;
  drawGroupPesertaIcon(ctx, paxX - 18, metaY, 26, '#FFFFFF');
  ctx.font = '800 19px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(kuotaText, paxX, metaY);
  ctx.restore();

  // 6. Floating Bottom Booking Bar
  drawBottomBookingBar(ctx, width, height, trip);

  return canvas;
}

// =======================================================
// SLIDE 2: FASILITAS INCLUDE, EXCLUDE, S&K (Matches user reference exactly)
// =======================================================
async function renderFacilitiesSlide(
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.25
): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = ratio === '4:5' ? 1350 : 1920;
  const { canvas, ctx } = await prepareBaseCanvas(width, height, bgUrl, dimRatio);

  const isRatio916 = ratio === '9:16';
  const padX = isRatio916 ? 64 : 52;
  const cardY = isRatio916 ? 68 : 46;
  const cardW = width - padX * 2;
  // Card extends down cleanly leaving an even 24-28px gap above the bottom booking bar
  const cardH = isRatio916 ? 1696 : 1152;

  // 1. Frosted Translucent Dark Emerald Card Container
  ctx.save();
  ctx.fillStyle = 'rgba(10, 24, 16, 0.65)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, padX, cardY, cardW, cardH, 26, true, true);
  ctx.restore();

  // Column Metrics
  const colLeftX = padX + 44;
  const colRightX = padX + Math.round(cardW * 0.54);
  const leftColTextMaxW = Math.round(cardW * 0.52 - 46);
  const rightColTextMaxW = Math.round(cardW * 0.44 - 36);

  let curY = cardY + (isRatio916 ? 64 : 52);

  // 2. Section Headers: INCLUDE & EXCLUDE
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 32px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('INCLUDE', colLeftX, curY);
  ctx.fillText('EXCLUDE', colRightX, curY);
  ctx.restore();

  curY += isRatio916 ? 54 : 44;

  // 3. Complete Include List (White Outline Icons - No Emoji)
  const defaultIncludes = [
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
  ];

  const incList = trip.include && trip.include.length > 0 ? trip.include : defaultIncludes;

  // Calculate dynamic step to display ALL items without cutting any off
  const incStep = isRatio916
    ? Math.max(42, Math.floor(700 / Math.max(incList.length, 14)))
    : Math.max(33, Math.floor(480 / Math.max(incList.length, 14)));

  let incY = curY;
  for (const itemText of incList) {
    // Draw crisp white outline vector icon
    drawFacilityIncludeIcon(ctx, itemText, colLeftX + 13, incY - 4, 22);

    // Text formatting
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = isRatio916
      ? '700 16.5px "Montserrat", "Plus Jakarta Sans", sans-serif'
      : '700 15px "Montserrat", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Wrap multi-line text cleanly
    const words = itemText.split(' ');
    let line = '';
    const lines: string[] = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > leftColTextMaxW && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    if (lines.length === 1) {
      ctx.fillText(lines[0], colLeftX + 36, incY - 4);
    } else {
      ctx.fillText(lines[0], colLeftX + 36, incY - 10);
      ctx.fillText(lines[1], colLeftX + 36, incY + 8);
    }
    ctx.restore();

    incY += incStep;
  }

  // 4. Exclude List (Circle Cross White Outline Icon)
  const defaultExcludes = [
    'Perlengkapan pribadi',
    'Surat sehat',
    'Obat-obatan pribadi khusus',
    'Logistik (camilan pribadi)',
    'Perlengkapan pendakian yang tidak ada di daftar',
    'Tip crew / guide / porter',
  ];
  const excList = trip.exclude && trip.exclude.length > 0 ? trip.exclude : defaultExcludes;

  const excStep = isRatio916 ? 48 : 38;
  let excY = curY;
  for (const itemText of excList) {
    drawWhiteExcludeCrossCircleIcon(ctx, colRightX + 12, excY - 4, 21);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = isRatio916
      ? '700 16px "Montserrat", "Plus Jakarta Sans", sans-serif'
      : '700 15px "Montserrat", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const words = itemText.split(' ');
    let line = '';
    const lines: string[] = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > rightColTextMaxW && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    if (lines.length === 1) {
      ctx.fillText(lines[0], colRightX + 36, excY - 4);
    } else {
      ctx.fillText(lines[0], colRightX + 36, excY - 10);
      ctx.fillText(lines[1], colRightX + 36, excY + 8);
    }
    ctx.restore();

    excY += excStep;
  }

  // 5. EXTRA PORTER PRIBADI
  excY += isRatio916 ? 22 : 16;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 20px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('EXTRA PORTER PRIBADI', colRightX, excY);

  excY += isRatio916 ? 26 : 22;
  ctx.font = '600 15.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(trip.extra_porter || 'Jika di perlukan', colRightX, excY);
  ctx.restore();

  // 6. S&K BERLAKU
  // Positioned underneath the include list with clean breathing room
  const skStartY = incY + (isRatio916 ? 24 : 16);
  let skY = skStartY;

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('S&K BERLAKU', colLeftX, skY);
  ctx.restore();

  skY += isRatio916 ? 36 : 30;

  const defaultSK = [
    'Peserta Untuk Umum (Sendiri Bisa Join)',
    'Apabila kuota tidak terpenuhi, akan ada biaya tambahan sesuai kesepakatan bersama',
    'DP minimal Rp 200.000',
    'Pelunasan Maksimal H-5',
    'Pembatalan Oleh Peserta: DP Hangus',
    'Trip Sesuai Jadwal (Diluar Jadwal Tersedia Private Trip)',
  ];
  const skList = trip.sk_berlaku && trip.sk_berlaku.length > 0 ? trip.sk_berlaku : defaultSK;

  const skStep = isRatio916 ? 40 : 31;
  for (const skText of skList) {
    // Circle Checkmark White Outline Icon
    drawWhiteCheckCircleIcon(ctx, colLeftX + 11, skY - 4, 20);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = isRatio916
      ? '600 15.5px "Plus Jakarta Sans", sans-serif'
      : '600 14.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(skText, colLeftX + 32, skY - 4);
    ctx.restore();

    skY += skStep;
  }

  // 7. Floating Bottom Booking Bar (Matches 1.png / 2.png / user asset)
  drawBottomBookingBar(ctx, width, height, trip);

  return canvas;
}

// =======================================================
// SLIDE 3: ITINERARY RUNDOWN ("untuk itinerary menyesuaikan")
// =======================================================
async function renderItinerarySlide(
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.25
): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = ratio === '4:5' ? 1350 : 1920;
  const { canvas, ctx } = await prepareBaseCanvas(width, height, bgUrl, dimRatio);

  const padX = 70;
  const isRatio916 = ratio === '9:16';
  const cardY = isRatio916 ? 120 : 80;
  const cardH = isRatio916 ? 1600 : 1120;
  const cardW = width - padX * 2;

  // Frosted Translucent Card
  ctx.save();
  ctx.fillStyle = 'rgba(12, 28, 18, 0.62)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  roundRect(ctx, padX, cardY, cardW, cardH, 28, true, true);
  ctx.restore();

  let curY = cardY + 54;

  // Header Title
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ITINERARY & RUNDOWN TRIP', width / 2, curY);

  curY += 44;
  const mtnName = (trip.nama_gunung || 'GUNUNG').toUpperCase();
  const jalurText = (trip.jalur || 'VIA BASECAMP').toUpperCase();
  ctx.font = '800 24px "Montserrat", "Space Grotesk", sans-serif';
  ctx.fillStyle = '#F59E0B'; // Amber accent
  ctx.fillText(`🏔️ ${mtnName} · 📌 ${jalurText}`, width / 2, curY);

  curY += 34;
  const allSchedules = getAllTripSchedules(trip);
  ctx.fillStyle = '#E2E8F0';
  if (allSchedules.length > 1) {
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    const schedulesSummary = allSchedules
      .map((s, i) => `${s.label || `Batch ${i + 1}`}: ${formatDateRange(s.tanggal_mulai, s.tanggal_selesai)}`)
      .join('   •   ');
    ctx.fillText(`📅 ${schedulesSummary}`, width / 2, curY);
  } else {
    const dateRange = formatDateRange(trip.tanggal_mulai, trip.tanggal_selesai);
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`📅 ${dateRange}   |   ⏱️ ${trip.durasi || '2 Hari 1 Malam'}`, width / 2, curY);
  }
  ctx.restore();

  curY += 28;

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX + 40, curY);
  ctx.lineTo(width - padX - 40, curY);
  ctx.stroke();

  curY += 36;

  // Parse Itinerary Lines
  const rawItin = trip.itinerary || '';
  const lines = rawItin.split('\n').map((l) => l.trim()).filter(Boolean);
  const maxContentY = cardY + cardH - 120;

  for (const line of lines) {
    if (curY > maxContentY) break;

    const isDayHeader = line.toLowerCase().startsWith('hari ') || line.startsWith('🗓️') || line.toLowerCase().startsWith('h-');

    if (isDayHeader) {
      curY += 12;
      ctx.save();
      // Day Header Pill
      ctx.fillStyle = '#F59E0B';
      roundRect(ctx, padX + 36, curY - 24, cardW - 72, 38, 8, true, false);

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 18px "Montserrat", "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(line.replace(/^[•\-\*\s]+/, ''), padX + 52, curY + 2);
      ctx.restore();
      curY += 36;
    } else {
      // Timeline item: check time pattern e.g. "07.00 - 08.00 : Activity"
      const match = line.match(/^([•\-\*]?\s*)?(\d{2}[.:]\d{2}(?:\s*-\s*(?:\d{2}[.:]\d{2}|selesai))?)\s*[:\-]?\s*(.*)$/i);
      if (match) {
        const timePart = match[2];
        const descPart = match[3];

        // Yellow Time Tag
        ctx.fillStyle = '#FBBF24';
        ctx.font = '800 16px "Montserrat", "Space Grotesk", sans-serif';
        ctx.fillText(timePart, padX + 46, curY);

        // White Description
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
        wrapText(ctx, descPart, padX + 210, curY, cardW - 250, 24);
        curY += 28;
      } else {
        ctx.fillStyle = '#F1F5F9';
        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        curY = wrapText(ctx, line, padX + 46, curY, cardW - 92, 24) + 4;
      }
    }
  }

  // Floating Bottom Booking Bar
  drawBottomBookingBar(ctx, width, height, trip);

  return canvas;
}

// =======================================================
// SLIDE 4: CATATAN PENTING (Matches 3.png)
// =======================================================
async function renderNotesSlide(
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.2
): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = ratio === '4:5' ? 1350 : 1920;
  const { canvas, ctx } = await prepareBaseCanvas(width, height, bgUrl, dimRatio);

  const isRatio916 = ratio === '9:16';
  const headerY = isRatio916 ? 320 : 220;

  // 1. Warning Icon (Triangle with !)
  ctx.save();
  const iconX = width / 2;
  const iconY = headerY;

  // Yellow rounded triangle
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(iconX, iconY - 50);
  ctx.lineTo(iconX + 54, iconY + 36);
  ctx.lineTo(iconX - 54, iconY + 36);
  ctx.closePath();
  ctx.fill();

  // Black exclamation mark
  ctx.fillStyle = '#000000';
  ctx.font = '900 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', iconX, iconY + 6);
  ctx.restore();

  // 2. Title "CATATAN PENTING"
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#F59E0B';
  ctx.font = '900 56px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CATATAN', width / 2, headerY + 110);
  ctx.fillText('PENTING', width / 2, headerY + 172);
  ctx.restore();

  // 3. Frosted Translucent Card with advice
  const cardW = width - 160;
  const cardH = isRatio916 ? 480 : 380;
  const cardX = (width - cardW) / 2;
  const cardY = headerY + 230;

  ctx.save();
  ctx.fillStyle = 'rgba(12, 28, 18, 0.62)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28, true, true);
  ctx.restore();

  // Card Content Top
  const defaultNote1 =
    'SEBELUM MENDAKI, SANGAT DISARANKAN UNTUK RUTIN BEROLAHRAGA SEPERTI JOGGING, HIKING RINGAN, ATAU LATIHAN KARDIO MINIMAL 1-2 MINGGU SEBELUMNYA.';
  const defaultNote2 =
    'MULAILAH DARI LATIHAN RINGAN, TINGKATKAN INTENSITASNYA, DAN PASTIKAN KONDISI TUBUH BENAR-BENAR SIAP';

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 24px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';

  const noteTopY = cardY + 70;
  wrapText(ctx, trip.catatan_penting || defaultNote1, width / 2, noteTopY, cardW - 80, 36, 'center');

  // Divider line inside card
  const divY = cardY + cardH * 0.58;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, divY);
  ctx.lineTo(cardX + cardW - 60, divY);
  ctx.stroke();

  // Card Content Bottom
  const noteBottomY = divY + 44;
  ctx.font = '800 20px "Montserrat", "Space Grotesk", sans-serif';
  wrapText(ctx, defaultNote2, width / 2, noteBottomY, cardW - 80, 32, 'center');
  ctx.restore();

  // Floating Bottom Booking Bar
  drawBottomBookingBar(ctx, width, height, trip);

  return canvas;
}

// =======================================================
// SLIDE 5: INFORMASI LEBIH LANJUT / CLOSING (Matches 1.png)
// =======================================================
async function renderContactSlide(
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.2,
  customLogoUrl?: string
): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = ratio === '4:5' ? 1350 : 1920;
  const { canvas, ctx } = await prepareBaseCanvas(width, height, bgUrl, dimRatio);

  const isRatio916 = ratio === '9:16';
  const cardW = width - 140;
  const cardH = isRatio916 ? 690 : 610;
  const cardX = (width - cardW) / 2;
  const cardY = isRatio916 ? 560 : 310;

  // Draw Cito Adventure Logo above card (Supports user uploaded custom logo)
  try {
    const activeLogoUrl = customLogoUrl || trip.logo_url || getCustomLogo() || OFFICIAL_LOGO_URL;
    const logoImg = await loadImage(activeLogoUrl);
    const naturalW = logoImg.naturalWidth || logoImg.width || 1;
    const naturalH = logoImg.naturalHeight || logoImg.height || 1;
    const aspect = naturalW / naturalH;
    const maxDimension = isRatio916 ? 150 : 124;
    const logoW = aspect >= 1 ? maxDimension : maxDimension * aspect;
    const logoH = aspect <= 1 ? maxDimension : maxDimension / aspect;
    const logoX = (width - logoW) / 2;
    const logoY = cardY - logoH - (isRatio916 ? 28 : 20);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 16;
    ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    ctx.restore();
  } catch (e) {
    console.warn('Could not load logo for contact slide', e);
  }

  // Dark Rounded Card Container (Matches 1.png)
  ctx.save();
  ctx.fillStyle = 'rgba(44, 53, 42, 0.96)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, 32, true, true);
  ctx.restore();

  // Pill Outline Header: "Informasi Lebih Lanjut"
  const pillW = 460;
  const pillH = 68;
  const pillX = (width - pillW) / 2;
  const pillY = cardY + 34;

  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2, true, true);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 30px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Informasi Lebih Lanjut', width / 2, pillY + pillH / 2);
  ctx.restore();

  // Contact items: 2x2 Grid of 4 Boxes (Matches 1.png)
  const waJatim = trip.kontak_wa_jatim || '+6282230444428';
  const waJakarta = trip.kontak_wa_jakarta || '+6289503689266';
  const rawIg = (trip.kontak_ig || 'CITO ADVENTURE MADIUN').replace(/^@/, '').toUpperCase();
  const cleanIgDisplay = rawIg.startsWith('@') ? rawIg : `@${rawIg}`;

  const boxesY = pillY + pillH + 28;
  const boxGapX = 20;
  const boxGapY = 16;
  const boxW = (cardW - 60 - boxGapX) / 2;
  const boxH = 106;

  // Box 1: Admin Jatim & Jateng (Top-Left)
  const b1X = cardX + 30;
  const b1Y = boxesY;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, b1X, b1Y, boxW, boxH, 18, true, true);
  drawWhatsAppIcon(ctx, b1X + 42, b1Y + boxH / 2, 42, '#FFFFFF');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 13px "Montserrat", sans-serif';
  ctx.fillText('ADMIN JATIM & JATENG', b1X + 80, b1Y + 38);
  ctx.font = '900 23px "Montserrat", "Space Grotesk", sans-serif';
  ctx.fillText(waJatim, b1X + 80, b1Y + 72);
  ctx.restore();

  // Box 2: Admin Jakarta & Sekitar (Top-Right)
  const b2X = b1X + boxW + boxGapX;
  const b2Y = boxesY;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, b2X, b2Y, boxW, boxH, 18, true, true);
  drawWhatsAppIcon(ctx, b2X + 42, b2Y + boxH / 2, 42, '#FFFFFF');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 13px "Montserrat", sans-serif';
  ctx.fillText('ADMIN JAKARTA & SEKITAR', b2X + 80, b2Y + 38);
  ctx.font = '900 23px "Montserrat", "Space Grotesk", sans-serif';
  ctx.fillText(waJakarta, b2X + 80, b2Y + 72);
  ctx.restore();

  // Box 3: Instagram (Bottom-Left)
  const b3X = cardX + 30;
  const b3Y = boxesY + boxH + boxGapY;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, b3X, b3Y, boxW, boxH, 18, true, true);
  drawInstagramIcon(ctx, b3X + 42, b3Y + boxH / 2, 38, '#FFFFFF');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 13px "Montserrat", sans-serif';
  ctx.fillText('INSTAGRAM', b3X + 80, b3Y + 38);
  ctx.font = '900 18px "Montserrat", "Space Grotesk", sans-serif';
  ctx.fillText(cleanIgDisplay, b3X + 80, b3Y + 72);
  ctx.restore();

  // Box 4: Live Streaming (Bottom-Right)
  const b4X = b3X + boxW + boxGapX;
  const b4Y = boxesY + boxH + boxGapY;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, b4X, b4Y, boxW, boxH, 18, true, true);
  drawTikTokLiveIcon(ctx, b4X + 42, b4Y + boxH / 2, 42, '#FFFFFF');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 13px "Montserrat", sans-serif';
  ctx.fillText('LIVE STREAMING', b4X + 80, b4Y + 38);
  ctx.font = '900 18px "Montserrat", "Space Grotesk", sans-serif';
  ctx.fillText(cleanIgDisplay, b4X + 80, b4Y + 72);
  ctx.restore();

  // "Detail trip & pendaftaran lengkap cek di caption"
  const captionMsgY = b3Y + boxH + 46;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Montserrat", "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('"Detail trip & pendaftaran lengkap cek di caption"', width / 2, captionMsgY);

  // Down Arrow ↓
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 38px sans-serif';
  ctx.fillText('↓', width / 2, captionMsgY + 44);
  ctx.restore();

  // Floating Bottom Booking Bar
  drawBottomBookingBar(ctx, width, height, trip);

  return canvas;
}

// =======================================================
// SLIDE 6: RANDOM FOTO / DOKUMENTASI BEBAS (Matches 2.png)
// Watermark Booking Only at bottom, full photo canvas
// =======================================================
async function renderRandomPhotoSlide(
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0,
  customPhotoUrl?: string
): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = ratio === '4:5' ? 1350 : 1920;

  // Use custom photo for slide 6 if provided, otherwise trip.slide6_photo_url, otherwise bgUrl, otherwise default
  const photoToUse =
    customPhotoUrl ||
    trip.slide6_photo_url ||
    bgUrl ||
    trip.background_url ||
    '/default-bg.jpg';

  // For slide 6, dimRatio defaults to 0 (clean, vibrant photo) unless dim specified
  const activeDim = Math.max(0, dimRatio);
  const { canvas, ctx } = await prepareBaseCanvas(width, height, photoToUse, activeDim);

  // Draw ONLY Floating Bottom Booking Bar (Matches 2.png exactly)
  drawBottomBookingBar(ctx, width, height, trip);

  return canvas;
}

// Master Slide Renderer Dispatcher
export async function renderSlideCanvas(
  slideType: SlideType,
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.2,
  customLogoUrl?: string,
  slide6PhotoUrl?: string
): Promise<HTMLCanvasElement> {
  switch (slideType) {
    case 'cover':
      return renderCoverSlide(trip, ratio, bgUrl, dimRatio, customLogoUrl);
    case 'facilities':
      return renderFacilitiesSlide(trip, ratio, bgUrl, dimRatio);
    case 'itinerary':
      return renderItinerarySlide(trip, ratio, bgUrl, dimRatio);
    case 'notes':
      return renderNotesSlide(trip, ratio, bgUrl, dimRatio);
    case 'contact':
      return renderContactSlide(trip, ratio, bgUrl, dimRatio, customLogoUrl);
    case 'random_photo':
      return renderRandomPhotoSlide(trip, ratio, bgUrl, dimRatio, slide6PhotoUrl);
    default:
      return renderCoverSlide(trip, ratio, bgUrl, dimRatio, customLogoUrl);
  }
}

// Download a single slide as PNG
export async function exportSlidePNG(
  slideType: SlideType,
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.2,
  customLogoUrl?: string,
  slide6PhotoUrl?: string
): Promise<void> {
  const canvas = await renderSlideCanvas(
    slideType,
    trip,
    ratio,
    bgUrl,
    dimRatio,
    customLogoUrl,
    slide6PhotoUrl
  );
  const cleanMtn = trip.nama_gunung.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanRatio = ratio.replace(':', 'x');
  const filename = `${slideType}-${cleanMtn}-${cleanRatio}.png`;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve();
    }, 'image/png');
  });
}

// Download ALL 6 Carousel Slides as a convenient ZIP package!
export async function exportAllSlidesZip(
  trip: Trip,
  ratio: '4:5' | '9:16',
  bgUrl?: string,
  dimRatio: number = 0.2,
  customLogoUrl?: string,
  slide6PhotoUrl?: string
): Promise<void> {
  const zip = new JSZip();
  const cleanMtn = trip.nama_gunung.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanRatio = ratio.replace(':', 'x');

  for (let idx = 0; idx < SLIDES_LIST.length; idx++) {
    const slide = SLIDES_LIST[idx];
    const canvas = await renderSlideCanvas(
      slide.id,
      trip,
      ratio,
      bgUrl,
      dimRatio,
      customLogoUrl,
      slide6PhotoUrl
    );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      zip.file(`slide-${idx + 1}-${slide.id}-${cleanMtn}-${cleanRatio}.png`, blob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `carousel-6-slides-${cleanMtn}-${cleanRatio}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Backward Compatibility Wrappers
export async function exportTripPamphletPNG(trip: Trip, ratio: '4:5' | '9:16'): Promise<void> {
  return exportSlidePNG('cover', trip, ratio, trip.background_url, trip.background_overlay_dim ?? 0.2);
}

export async function exportItineraryPosterPNG(trip: Trip, ratio: '4:5' | '9:16'): Promise<void> {
  return exportSlidePNG('itinerary', trip, ratio, trip.background_url, trip.background_overlay_dim ?? 0.2);
}
