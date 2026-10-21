import { unstable_rethrow as rethrowNextSignals } from 'next/navigation';

// Server Components fetch the API directly (not through the /api rewrite).
// Only public, non-personal data is fetched on the server; anything that depends
// on the signed-in member is loaded in the browser with the client API.

const API_URL = process.env.API_URL || 'http://localhost:4000';

export class ApiUnavailableError extends Error {}

/**
 * GETs a public endpoint. Returns null for 404 and throws ApiUnavailableError when
 * the API cannot be reached or fails, so pages can decide how to degrade.
 * @param {string} path e.g. "/biodatas/featured"
 * @param {{ revalidate?: number }} [options] cache the response for N seconds
 */
export async function getPublic(path, { revalidate } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, revalidate ? { next: { revalidate } } : { cache: 'no-store' });
  } catch (err) {
    // Next.js signals dynamic rendering by throwing from fetch; let it through.
    rethrowNextSignals(err);
    throw new ApiUnavailableError(`API unreachable for ${path}: ${err.message}`);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiUnavailableError(`API responded ${res.status} for ${path}`);
  return res.json();
}

/** Like getPublic, but returns `fallback` instead of throwing, for non-essential page sections. */
export async function getPublicOr(fallback, path, options) {
  try {
    return (await getPublic(path, options)) ?? fallback;
  } catch (err) {
    rethrowNextSignals(err);
    console.error(err.message);
    return fallback;
  }
}
