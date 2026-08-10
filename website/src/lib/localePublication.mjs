import {isIndexablePublishedLocale, publishedLocales} from './publishedLocales.mjs';

// A route is not a quality claim. Only locales that pass the content and UI
// gates below are indexable; the remaining routes stay available for review.
export const localePublication = Object.freeze(
  publishedLocales.map((locale) => ({
    locale: locale.locale,
    status: isIndexablePublishedLocale(locale.locale) ? 'verified' : 'machine-translated',
    indexable: isIndexablePublishedLocale(locale.locale),
  })),
);

export const localePublicationMap = Object.freeze(
  Object.fromEntries(localePublication.map((entry) => [entry.locale, entry])),
);

export const indexableLocaleCodes = localePublication
  .filter(({indexable}) => indexable)
  .map(({locale}) => locale);

export function isIndexableLocale(locale) {
  return Boolean(localePublicationMap[locale]?.indexable);
}

export function localePublicationLabel(locale) {
  const publication = localePublicationMap[locale];
  if (!publication || publication.status === 'verified') {
    return '';
  }
  return ' [MT]';
}
