import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface AssetUploadResult {
  url: string;
  filename?: string;
  size?: number;
}

/**
 * Uploads an image file to the asset storage system (Firebase Storage with Server API fallback).
 * Stores files in the persistent storage system and returns a clean URL reference,
 * preventing huge base64 Data URLs from bloating settings payloads or Firestore documents.
 */
export async function uploadSiteAsset(file: File, folder = 'branding'): Promise<string> {
  if (!file) throw new Error('No file provided for upload.');

  // Validate file type
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/gif'
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}. Allowed formats: PNG, JPG, WebP, SVG, GIF, ICO.`);
  }

  // Bounded file size limit (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 5 MB.`);
  }

  const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // 1. Try Firebase Storage if available
  if (storage) {
    try {
      const storageRef = ref(storage, `site-assets/${folder}/${cleanName}`);
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Storage timeout')), 6000)
      );
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (downloadUrl) {
        return downloadUrl;
      }
    } catch (storageErr: any) {
      console.warn('Firebase Storage client upload notice, using backend asset storage API fallback:', storageErr?.message || storageErr);
    }
  }

  // 2. Authoritative backend upload endpoint fallback
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/admin/site-settings/upload-asset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: base64Data,
      filename: cleanName,
      mimeType: file.type,
      folder
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to upload image (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (!data.url) {
    throw new Error('Server did not return a valid asset URL.');
  }

  return data.url;
}

/**
 * Scans a settings object and replaces any embedded base64 Data URLs with stored asset URLs.
 * Ensures the published JSON payload is clean, bounded, and contains only URL references.
 */
export async function extractAndUploadBase64Assets(data: any): Promise<any> {
  if (!data) return data;

  if (typeof data === 'string') {
    // If it's a data URL image longer than 256 bytes, upload it to storage
    if (data.startsWith('data:image/') && data.includes(';base64,') && data.length > 256) {
      try {
        const mimeMatch = data.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const ext = mimeType.split('/')[1]?.replace('+xml', '') || 'png';
        const filename = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const res = await fetch('/api/admin/site-settings/upload-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data,
            filename,
            mimeType
          })
        });

        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            return result.url;
          }
        }
      } catch (err) {
        console.warn('Could not extract base64 asset to storage, keeping original:', err);
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    const newArr = [];
    for (const item of data) {
      newArr.push(await extractAndUploadBase64Assets(item));
    }
    return newArr;
  }

  if (typeof data === 'object') {
    const newObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      newObj[key] = await extractAndUploadBase64Assets(value);
    }
    return newObj;
  }

  return data;
}
