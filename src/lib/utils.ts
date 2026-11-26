import type { EventLocationData } from '../types/invitation';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function generateSecureToken(length = 24): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = 'inv_';
  for (let i = 0; i < length; i++) {
    result += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return result;
}

export function generateId(prefix = 'id'): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `${prefix}_${hex}`;
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function buildDirectionsUrl(location: EventLocationData): string {
  if (location.latitude !== null && location.longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
  }
  const query = [
    location.venueName,
    location.fullAddress,
    location.city,
    location.state,
    location.postalCode,
  ]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function buildOpenMapsUrl(location: EventLocationData): string {
  if (location.googleMapsUrl && isSafeHttpUrl(location.googleMapsUrl)) {
    return location.googleMapsUrl;
  }
  if (location.latitude !== null && location.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  const query = [
    location.venueName,
    location.fullAddress,
    location.city,
    location.state,
    location.postalCode,
  ]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function parseGoogleMapsUrl(rawUrl: string): {
  latitude: number | null;
  longitude: number | null;
  venueHint: string;
} {
  if (!isSafeHttpUrl(rawUrl)) {
    return { latitude: null, longitude: null, venueHint: '' };
  }
  try {
    const url = new URL(rawUrl.trim());
    const atMatch = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
      return {
        latitude: Number.parseFloat(atMatch[1]),
        longitude: Number.parseFloat(atMatch[2]),
        venueHint: placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : '',
      };
    }

    const qParam = url.searchParams.get('q') || url.searchParams.get('query') || '';
    const coordMatch = qParam.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      return {
        latitude: Number.parseFloat(coordMatch[1]),
        longitude: Number.parseFloat(coordMatch[2]),
        venueHint: '',
      };
    }

    const llParam = url.searchParams.get('ll') || '';
    const llMatch = llParam.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (llMatch) {
      return {
        latitude: Number.parseFloat(llMatch[1]),
        longitude: Number.parseFloat(llMatch[2]),
        venueHint: qParam,
      };
    }

    return { latitude: null, longitude: null, venueHint: qParam };
  } catch {
    return { latitude: null, longitude: null, venueHint: '' };
  }
}

export function buildGuestDisplayGreeting(guestName: string, isFamily: boolean): string {
  const clean = guestName.trim();
  if (!clean) return 'Honored Guest';
  if (isFamily && !/family/i.test(clean)) {
    return `${clean} & Family`;
  }
  return clean;
}

export function buildWhatsAppShareUrl(params: {
  guestName: string;
  isFamily: boolean;
  phone?: string;
  eventTitle: string;
  inviteUrl: string;
}): string {
  const displayName = buildGuestDisplayGreeting(params.guestName, params.isFamily);
  const message = [
    `Dear ${displayName},`,
    '',
    `We are delighted to invite you to ${params.eventTitle}!`,
    '',
    'Please open your personalized digital invitation here:',
    params.inviteUrl,
    '',
    'Your presence will make our celebration even more special.',
  ].join('\n');

  const digits = (params.phone || '').replace(/[^\d]/g, '');
  const base = digits.length >= 7 ? `https://wa.me/${digits}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'Date to be announced';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDisplayTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [hoursRaw, minutesRaw] = timeStr.split(':');
  const h = Number.parseInt(hoursRaw || '0', 10);
  const m = Number.parseInt(minutesRaw || '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export async function compressImageToDataUrl(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error('Please upload a JPG, JPEG, PNG, or WebP image.');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Image file size must be under 12 MB.');
  }

  onProgress?.(25);
  const bitmapUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not read the selected image.'));
      image.src = bitmapUrl;
    });

    onProgress?.(60);

    const maxDim = 1280;
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas image optimization is unavailable.');
    }
    ctx.drawImage(img, 0, 0, width, height);

    onProgress?.(85);
    let dataUrl = canvas.toDataURL('image/webp', 0.8);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    }
    if (dataUrl.length > 165000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.66);
    }
    onProgress?.(100);
    return dataUrl;
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return '—';
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  if (ts instanceof Date) {
    return ts.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return '—';
}
