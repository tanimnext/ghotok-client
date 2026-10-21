import { useSearchParams } from 'react-router';

/**
 * A single URL search parameter as state, so filters and tabs are shareable and
 * survive a reload. Setting a value resets `page` to 1.
 */
export function useQueryParam(key, fallback = '') {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? fallback;
  const setValue = (next) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === '' || next === undefined || next === null || next === fallback) p.delete(key);
        else p.set(key, String(next));
        if (key !== 'page') p.delete('page');
        return p;
      },
      { replace: true },
    );
  return [value, setValue];
}

/** The current page number from the URL. */
export function usePageParam() {
  const [page, setPage] = useQueryParam('page', '1');
  return [Number(page) || 1, (p) => setPage(String(p))];
}
