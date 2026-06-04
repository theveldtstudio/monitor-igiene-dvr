// Utility per gestione foto in Supabase Storage.
// Bucket: misure-foto (privato).
// Path schema: <misuraId>/<uuid>.jpg
// Le foto vengono compresse lato browser prima dell'upload.

import { supabase } from '../lib/supabase';

const BUCKET = 'misure-foto';
const MAX_DIMENSION = 1280; // px lato lungo
const JPEG_QUALITY = 0.7;

// ─────────────────────────────────────────────────────────
// Compressione client-side
// ─────────────────────────────────────────────────────────

/**
 * Comprime un File immagine: ridimensiona a max 1280px lato lungo,
 * converte in JPEG qualità 0.7. Ritorna un Blob pronto per upload.
 */
export async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file);
  const img = await dataUrlToImage(dataUrl);

  const { width, height } = scaleToMax(img.width, img.height, MAX_DIMENSION);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context non disponibile');

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob fallito'));
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load fallito'));
    img.src = dataUrl;
  });
}

function scaleToMax(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

// ─────────────────────────────────────────────────────────
// UUID generator (no librerie esterne)
// ─────────────────────────────────────────────────────────

function uuid(): string {
  // crypto.randomUUID() disponibile su browser moderni
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback molto basico (non usato in browser moderni)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─────────────────────────────────────────────────────────
// Upload / Delete / Signed URL
// ─────────────────────────────────────────────────────────

/**
 * Carica un Blob GIÀ compresso nel bucket. Ritorna il path salvato.
 * Usato dall'executor offline: il blob in foto_blobs è già passato da compressImage,
 * quindi NON va ri-compresso (evita doppia compressione lossy).
 */
export async function uploadFotoBlob(
  misuraId: string | number,
  blob: Blob,
  opts?: { path?: string; upsert?: boolean }
): Promise<string> {
  const path = opts?.path ?? `${misuraId}/${uuid()}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: opts?.upsert ?? false,
    });

  if (error) {
    console.error('uploadFotoBlob error:', error);
    throw new Error(`Upload foto fallito: ${error.message}`);
  }

  return path;
}

/**
 * Carica una foto compressa nel bucket. Ritorna il path salvato (da memorizzare in dati.foto_urls).
 */
export async function uploadFoto(misuraId: string | number, file: File): Promise<string> {
  const compressed = await compressImage(file);
  return uploadFotoBlob(misuraId, compressed);
}

/**
 * Cancella una foto dal bucket dato il path (es. "123/abc-def.jpg").
 */
export async function deleteFoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error('deleteFoto error:', error);
    throw new Error(`Cancellazione foto fallita: ${error.message}`);
  }
}

/**
 * Ottieni un signed URL per visualizzare una foto (validità 1 ora di default).
 */
export async function getFotoUrl(path: string, expiresInSec = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSec);

  if (error || !data) {
    console.error('getFotoUrl error:', error);
    throw new Error(`Generazione URL foto fallita: ${error?.message || 'unknown'}`);
  }

  return data.signedUrl;
}

/**
 * Ottieni signed URL per multiple foto in una chiamata.
 */
export async function getFotoUrls(paths: string[], expiresInSec = 3600): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresInSec);

  if (error) {
    console.error('getFotoUrls error:', error);
    throw new Error(`Generazione URLs foto fallita: ${error.message}`);
  }

  const map: Record<string, string> = {};
  data?.forEach((entry, i) => {
    if (entry.signedUrl) map[paths[i]] = entry.signedUrl;
  });
  return map;
}
