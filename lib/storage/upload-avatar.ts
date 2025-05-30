/*
 * upload-avatar.ts
 * -----------------
 * Helper utilities for client-side avatar uploads. Adapted from the proven
 * implementation in the Sunni waitlist-app (2025-06-02).
 *
 * Key features:
 *  1. Image downsizing to max 500 px on the longest side and 0.8 JPEG quality.
 *  2. Uploads the resulting file to Supabase Storage bucket `avatars/` under
 *     `<userId>/<UUID>.<ext>` (upsert).
 *  3. Returns the public URL so callers can persist it to `waitlist_signups.avatar_url`.
 *
 * Usage example:
 * ```ts
 * const publicUrl = await uploadAvatar(userId, file)
 * await supabase.from('waitlist_signups').update({ avatar_url: publicUrl }).eq('id', rowId)
 * ```
 */

'use client';

import { createClient } from '@/utils/supabase/client';

/**
 * Compress an image File down to a reasonably small JPEG.
 * Falls back to original if anything fails.
 */
export async function compressImage(original: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return resolve(original);
      img.src = e.target.result as string;
    };

    img.onload = () => {
      const MAX_SIZE = 500; // px (longest side)
      const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(original);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(original);
          const compressed = new File([blob], original.name.replace(/\.[^.]+$/, '_compressed.jpg'), {
            type: 'image/jpeg',
          });
          resolve(compressed);
        },
        'image/jpeg',
        0.8,
      );
    };

    reader.onerror = () => resolve(original);
    reader.readAsDataURL(original);
  });
}

/**
 * Upload an avatar to Supabase Storage and return its public URL.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();

  // Compress client-side (best-effort)
  const uploadFile = await compressImage(file);

  const fileExt = uploadFile.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload (upsert so the latest always overwrites previous)
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, uploadFile, { upsert: true, contentType: uploadFile.type });

  if (uploadError) throw new Error(uploadError.message);

  // Return public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Failed to generate public URL');
  }

  return urlData.publicUrl;
} 