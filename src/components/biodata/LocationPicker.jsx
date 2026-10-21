'use client';

import { useQuery } from '@tanstack/react-query';
import { DIVISION_OPTIONS, districtsOf, formatNumber, upazilasOf } from '@/shared';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';

/**
 * Division → district → upazila picker for one address (permanent or present),
 * with the number of matching biodatas next to every place. Counts respect the
 * other filters but not the location being picked.
 *
 * @param {{ scope: 'permanent' | 'present', value: { division?: string, district?: string, upazila?: string },
 *   onChange: (v: { division: string, district: string, upazila: string }) => void, filters: object }} props
 */
export function LocationPicker({ scope, value, onChange, filters }) {
  const { t, lang } = useT();
  const counts = useQuery({
    queryKey: ['location-counts', scope, filters],
    queryFn: () => biodataApi.locationCounts({ ...filters, scope }),
    staleTime: 60_000,
  });
  const withCount = (label, n) => (n ? `${label} (${formatNumber(n, lang)})` : label);
  const data = counts.data ?? {};
  const present = scope === 'present';
  // Present addresses are stored by district only, so the division only narrows the district list.
  const divisionCount = (division) =>
    present
      ? districtsOf(division).reduce((sum, d) => sum + (data.districts?.[d.value] ?? 0), 0)
      : data.divisions?.[division];

  const select = (label, current, options, change, disabled) => (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <select
        className="field-input text-[15px]"
        value={current ?? ''}
        disabled={disabled}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">{t('common.all')}</option>
        {options}
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-2.5">
      {select(
        t('browse.division'),
        value.division,
        DIVISION_OPTIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {withCount(d[lang], divisionCount(d.value))}
          </option>
        )),
        (division) => onChange({ division, district: '', upazila: '' }),
      )}
      {select(
        t('browse.districtShort'),
        value.district,
        districtsOf(value.division).map((d) => (
          <option key={d.value} value={d.value}>
            {withCount(d[lang], data.districts?.[d.value])}
          </option>
        )),
        (district) => onChange({ ...value, district, upazila: '' }),
      )}
      {select(
        t('browse.upazila'),
        value.upazila,
        upazilasOf(value.district).map((u) => (
          <option key={u.value} value={u.value}>
            {withCount(u[lang], data.upazilas?.[u.value])}
          </option>
        )),
        (upazila) => onChange({ ...value, upazila }),
        !value.district,
      )}
    </div>
  );
}
