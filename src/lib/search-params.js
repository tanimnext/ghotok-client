// The browse page keeps its filters in the URL so results can be shared and
// bookmarked. These are the parameters the API understands (see the API's
// biodata.validation.js → searchQuery).
export const SEARCH_KEYS = [
  'type',
  'religion',
  'marital',
  'ageMin',
  'ageMax',
  'heightMin',
  'heightMax',
  'division',
  'district',
  'upazila',
  'presentDistrict',
  'presentUpazila',
  'medium',
  'category',
  'education',
  'profession',
  'complexion',
  'economic',
  'q',
  'sort',
  'page',
];

/** Picks known keys from Next.js searchParams into a plain object of strings. */
export function pickSearch(searchParams) {
  const out = {};
  for (const key of SEARCH_KEYS) {
    const value = searchParams?.[key];
    if (value !== undefined && value !== '')
      out[key] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return out;
}

export function toQueryString(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  return qs ? `?${qs}` : '';
}
