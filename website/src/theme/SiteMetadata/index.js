import React from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {PageMetadata, useThemeConfig} from '@docusaurus/theme-common';
import {
  DEFAULT_SEARCH_TAG,
  useAlternatePageUtils,
} from '@docusaurus/theme-common/internal';
import {useLocation} from '@docusaurus/router';
import {applyTrailingSlash} from '@docusaurus/utils-common';
import SearchMetadata from '@theme/SearchMetadata';
import {
  shouldExposeZhCnLanguageSignal,
} from '../../lib/languageRoutePolicy';

function AlternateLangHeaders() {
  const {
    siteConfig,
    i18n: {currentLocale, defaultLocale, localeConfigs},
  } = useDocusaurusContext();
  const {pathname} = useLocation();
  const alternatePageUtils = useAlternatePageUtils();
  const currentHtmlLang = localeConfigs[currentLocale].htmlLang;
  const suppressAlternates = currentLocale === 'zh-CN' && !shouldExposeZhCnLanguageSignal(pathname, siteConfig.baseUrl);
  const bcp47ToOpenGraphLocale = (code) => code.replace('-', '_');
  const shouldExposeLocale = (locale) => {
    if (suppressAlternates) {
      return false;
    }

    return locale !== 'zh-CN' || shouldExposeZhCnLanguageSignal(pathname, siteConfig.baseUrl);
  };
  const exposedLocaleConfigs = Object.entries(localeConfigs).filter(([locale]) => shouldExposeLocale(locale));

  return (
    <Head>
      {exposedLocaleConfigs.map(([locale, {htmlLang}]) => (
        <link
          key={locale}
          rel="alternate"
          href={alternatePageUtils.createUrl({
            locale,
            fullyQualified: true,
          })}
          hrefLang={htmlLang}
        />
      ))}
      {!suppressAlternates ? (
        <link
          rel="alternate"
          href={alternatePageUtils.createUrl({
            locale: defaultLocale,
            fullyQualified: true,
          })}
          hrefLang="x-default"
        />
      ) : null}

      <meta
        property="og:locale"
        content={bcp47ToOpenGraphLocale(currentHtmlLang)}
      />
      {exposedLocaleConfigs
        .filter(([, config]) => currentHtmlLang !== config.htmlLang)
        .map(([, config]) => (
          <meta
            key={`meta-og-${config.htmlLang}`}
            property="og:locale:alternate"
            content={bcp47ToOpenGraphLocale(config.htmlLang)}
          />
        ))}
    </Head>
  );
}

function useDefaultCanonicalUrl() {
  const {
    siteConfig: {url: siteUrl, baseUrl, trailingSlash},
  } = useDocusaurusContext();
  const {pathname} = useLocation();
  const canonicalPathname = applyTrailingSlash(useBaseUrl(pathname), {
    trailingSlash,
    baseUrl,
  });
  return siteUrl + canonicalPathname;
}

function CanonicalUrlHeaders({permalink}) {
  const {
    siteConfig: {url: siteUrl},
  } = useDocusaurusContext();
  const defaultCanonicalUrl = useDefaultCanonicalUrl();
  const canonicalUrl = permalink
    ? `${siteUrl}${permalink}`
    : defaultCanonicalUrl;
  return (
    <Head>
      <meta property="og:url" content={canonicalUrl} />
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}

export default function SiteMetadata() {
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();
  const {metadata, image: defaultImage} = useThemeConfig();
  return (
    <>
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        <body />
      </Head>

      {defaultImage && <PageMetadata image={defaultImage} />}

      <CanonicalUrlHeaders />

      <AlternateLangHeaders />

      <SearchMetadata tag={DEFAULT_SEARCH_TAG} locale={currentLocale} />

      <Head>
        {metadata.map((metadatum, i) => (
          <meta key={i} {...metadatum} />
        ))}
      </Head>
    </>
  );
}
