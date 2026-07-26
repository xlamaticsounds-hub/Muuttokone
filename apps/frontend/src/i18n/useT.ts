'use client';

import { useLocale } from './LocaleContext';

/**
 * Translation hook keyed by the ORIGINAL FINNISH STRING rather than an abstract key name.
 * This lets existing JSX text nodes get wrapped with t('Suomeksi') without renaming anything —
 * much smaller, lower-risk diff than restructuring a large existing component into semantic
 * i18n keys. Falls back to the Finnish text itself whenever no English entry exists, so it's
 * always safe to wrap a string even before its translation has been added to the dictionary.
 */
export function useT(dictionary: Record<string, string>) {
  const { locale } = useLocale();
  return (fi: string): string => {
    if (locale === 'en') {
      return dictionary[fi] ?? fi;
    }
    return fi;
  };
}
