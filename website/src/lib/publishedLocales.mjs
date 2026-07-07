export const publishedLocales = [
  {locale: 'en', label: 'English', direction: 'ltr', htmlLang: 'en-US', englishName: 'English'},
  {locale: 'zh-CN', label: '简体中文', direction: 'ltr', htmlLang: 'zh-CN', englishName: 'Simplified Chinese'},
  {locale: 'zh-Hant', label: '繁體中文', direction: 'ltr', htmlLang: 'zh-Hant', englishName: 'Traditional Chinese'},
  {locale: 'zh-TW', label: '繁體中文（台灣）', direction: 'ltr', htmlLang: 'zh-TW', englishName: 'Traditional Chinese for Taiwan'},
  {locale: 'ja', label: '日本語', direction: 'ltr', htmlLang: 'ja-JP', englishName: 'Japanese'},
  {locale: 'fr', label: 'Français', direction: 'ltr', htmlLang: 'fr-FR', englishName: 'French'},
  {locale: 'de', label: 'Deutsch', direction: 'ltr', htmlLang: 'de-DE', englishName: 'German'},
  {locale: 'es', label: 'Español', direction: 'ltr', htmlLang: 'es-ES', englishName: 'Spanish'},
  {locale: 'ko', label: '한국어', direction: 'ltr', htmlLang: 'ko-KR', englishName: 'Korean'},
  {locale: 'it', label: 'Italiano', direction: 'ltr', htmlLang: 'it-IT', englishName: 'Italian'},
  {locale: 'pt', label: 'Português', direction: 'ltr', htmlLang: 'pt-PT', englishName: 'Portuguese'},
  {locale: 'pt-BR', label: 'Português (Brasil)', direction: 'ltr', htmlLang: 'pt-BR', englishName: 'Brazilian Portuguese'},
  {locale: 'ru', label: 'Русский', direction: 'ltr', htmlLang: 'ru-RU', englishName: 'Russian'},
  {locale: 'ar', label: 'العربية', direction: 'rtl', htmlLang: 'ar', englishName: 'Arabic'},
  {locale: 'fa', label: 'فارسی', direction: 'rtl', htmlLang: 'fa', englishName: 'Persian'},
  {locale: 'hi', label: 'हिन्दी', direction: 'ltr', htmlLang: 'hi-IN', englishName: 'Hindi'},
  {locale: 'bn', label: 'বাংলা', direction: 'ltr', htmlLang: 'bn-BD', englishName: 'Bengali'},
  {locale: 'nl', label: 'Nederlands', direction: 'ltr', htmlLang: 'nl-NL', englishName: 'Dutch'},
  {locale: 'sv', label: 'Svenska', direction: 'ltr', htmlLang: 'sv-SE', englishName: 'Swedish'},
  {locale: 'fi', label: 'Suomi', direction: 'ltr', htmlLang: 'fi-FI', englishName: 'Finnish'},
  {locale: 'da', label: 'Dansk', direction: 'ltr', htmlLang: 'da-DK', englishName: 'Danish'},
  {locale: 'no', label: 'Norsk', direction: 'ltr', htmlLang: 'no', englishName: 'Norwegian'},
  {locale: 'pl', label: 'Polski', direction: 'ltr', htmlLang: 'pl-PL', englishName: 'Polish'},
  {locale: 'tr', label: 'Türkçe', direction: 'ltr', htmlLang: 'tr-TR', englishName: 'Turkish'},
  {locale: 'he', label: 'עברית', direction: 'rtl', htmlLang: 'he', englishName: 'Hebrew'},
  {locale: 'th', label: 'ไทย', direction: 'ltr', htmlLang: 'th-TH', englishName: 'Thai'},
  {locale: 'el', label: 'Ελληνικά', direction: 'ltr', htmlLang: 'el-GR', englishName: 'Greek'},
  {locale: 'cs', label: 'Čeština', direction: 'ltr', htmlLang: 'cs-CZ', englishName: 'Czech'},
  {locale: 'hu', label: 'Magyar', direction: 'ltr', htmlLang: 'hu-HU', englishName: 'Hungarian'},
  {locale: 'ro', label: 'Română', direction: 'ltr', htmlLang: 'ro-RO', englishName: 'Romanian'},
  {locale: 'uk', label: 'Українська', direction: 'ltr', htmlLang: 'uk-UA', englishName: 'Ukrainian'},
  {locale: 'vi', label: 'Tiếng Việt', direction: 'ltr', htmlLang: 'vi-VN', englishName: 'Vietnamese'},
  {locale: 'id', label: 'Bahasa Indonesia', direction: 'ltr', htmlLang: 'id-ID', englishName: 'Indonesian'},
  {locale: 'ms', label: 'Bahasa Melayu', direction: 'ltr', htmlLang: 'ms-MY', englishName: 'Malay'},
];

export const publishedDocumentationLocales = publishedLocales.filter(({locale}) => locale !== 'en');
export const publishedLocaleCodes = publishedLocales.map(({locale}) => locale);
export const publishedDocumentationLocaleCodes = publishedDocumentationLocales.map(({locale}) => locale);
export const publishedDocumentationLanguageNames = publishedDocumentationLocales.map(({englishName}) => englishName);

export function publishedLocaleConfigMap() {
  return Object.fromEntries(
    publishedLocales.map(({locale, label, direction, htmlLang}) => [
      locale,
      {label, direction, htmlLang},
    ]),
  );
}

export function publishedLanguageScopeSentence() {
  return `The public docs route set is available in English, ${publishedDocumentationLanguageNames.join(', ')}.`;
}
