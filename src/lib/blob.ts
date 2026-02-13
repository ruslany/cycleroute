import { put, del } from '@vercel/blob';

export async function uploadGpx(filename: string, gpxData: string): Promise<string> {
  const blob = await put(`gpx/${filename}`, gpxData, {
    access: 'public',
    contentType: 'application/gpx+xml',
  });
  return blob.url;
}

export async function downloadGpx(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download GPX from blob: ${response.status}`);
  }
  return response.text();
}

export async function deleteGpx(url: string): Promise<void> {
  await del(url);
}
