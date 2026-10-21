import { ApiError } from '@/shared/api-client';

// Images (ticket and report attachments, banners) are uploaded straight from the
// browser to ImgBB; the API only stores the returned links. ImgBB links are public
// to anyone who has them, so never upload private documents this way.

const UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const MB = 1024 * 1024;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 5 * MB;

/** True when an ImgBB API key is configured for this build. */
export const imgbbEnabled = () => !!process.env.NEXT_PUBLIC_IMGBB_API_KEY;

/**
 * Checks a picked file before uploading it.
 * @returns {null | 'badType' | 'tooBig'}
 */
export function imageProblem(file) {
  if (!IMAGE_TYPES.includes(file.type)) return 'badType';
  if (file.size > MAX_IMAGE_BYTES) return 'tooBig';
  return null;
}

/**
 * Uploads one image to ImgBB.
 * @param {File} file
 * @returns {Promise<{ url: string, thumbUrl: string, name: string }>} `url` is the direct image link
 * @throws {ApiError}
 */
export async function uploadImage(file) {
  const key = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!key) throw new ApiError(0, 'IMGBB_NOT_CONFIGURED', 'Image uploads are not set up.');
  const problem = imageProblem(file);
  if (problem)
    throw new ApiError(400, problem === 'badType' ? 'BAD_TYPE' : 'TOO_LARGE', 'Unsupported image.');

  const form = new FormData();
  form.append('image', file);
  form.append('name', file.name.replace(/\.[^.]+$/, '').slice(0, 100));
  const res = await fetch(`${UPLOAD_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    body: form,
  }).catch(() => null);
  const body = await res?.json().catch(() => null);
  if (!res?.ok || !body?.success || !body.data?.url) {
    throw new ApiError(res?.status ?? 0, 'UPLOAD_FAILED', 'The upload failed. Please try again.');
  }
  return { url: body.data.url, thumbUrl: body.data.thumb?.url ?? body.data.url, name: file.name };
}
