import type { APIRoute } from 'astro';
import { getPresignedUploadUrl } from '../../../lib/s3';

export const POST: APIRoute = async ({ request }) => {
  const { filename, contentType } = await request.json();
  if (!filename || !contentType) {
    return new Response(JSON.stringify({ error: 'filename and contentType required' }), { status: 400 });
  }

  const ext = filename.split('.').pop();
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

  return new Response(JSON.stringify({ uploadUrl, publicUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
