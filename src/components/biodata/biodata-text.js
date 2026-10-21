import {
  BIODATA_TYPES,
  DISTRICTS,
  EDUCATION_LEVELS,
  MARITAL_STATUS,
  PROFESSIONS,
  RELIGIONS,
  optionLabel,
} from '@/shared';
import { digits } from '@/lib/format';

/** Human-readable lines for a biodata card, in the reader's language. */
export function cardText(b, t, lang) {
  const type = optionLabel(BIODATA_TYPES, b.type, lang);
  const marital = optionLabel(MARITAL_STATUS, b.maritalStatus, lang);
  const district = optionLabel(DISTRICTS, b.district, lang);
  const religion = optionLabel(RELIGIONS, b.religion, lang);
  return {
    id: [b.biodataNo, type].filter(Boolean).join(' · '),
    title: [b.age ? t('common.years', { n: digits(b.age, lang) }) : null, marital]
      .filter(Boolean)
      .join(' · '),
    education: b.institution || optionLabel(EDUCATION_LEVELS, b.educationLevel, lang),
    job: b.jobTitle || optionLabel(PROFESSIONS, b.profession, lang),
    place: [district, religion].filter(Boolean).join(' · '),
  };
}
