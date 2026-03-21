import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'device_images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function validateDeviceImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Only image files are allowed.';
  if (file.size > MAX_FILE_SIZE_BYTES) return 'Each photo must be up to 5MB.';
  return null;
}

export async function uploadDeviceImages(ticketTokenId: string, files: File[]): Promise<string[]> {
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const cleanName = sanitizeFileName(file.name);
    const uniquePath = `${ticketTokenId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(uniquePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (error) throw error;
    uploadedPaths.push(uniquePath);
  }

  return uploadedPaths;
}

export function getDeviceImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

