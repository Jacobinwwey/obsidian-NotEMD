import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useAlternatePageUtils} from '@docusaurus/theme-common/internal';
import {translate} from '@docusaurus/Translate';
import {mergeSearchStrings, useHistorySelector} from '@docusaurus/theme-common';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import IconLanguage from '@theme/Icon/Language';
import {
  canonicalEnglishSitePath,
  shouldExposeZhCnLanguageSignal,
  zhCnRootSitePath,
} from '../../../lib/languageRoutePolicy';
import styles from './styles.module.css';

function useLocaleDropdownUrls() {
  const {
    siteConfig,
    i18n: {localeConfigs},
  } = useDocusaurusContext();
  const alternatePageUtils = useAlternatePageUtils();
  const pathname = useHistorySelector((history) => history.location.pathname);
  const search = useHistorySelector((history) => history.location.search);
  const hash = useHistorySelector((history) => history.location.hash);
  const zhCnSignalAvailable = shouldExposeZhCnLanguageSignal(pathname, siteConfig.baseUrl);
  const getLocaleConfig = (locale) => {
    const localeConfig = localeConfigs[locale];
    if (!localeConfig) {
      throw new Error(
        `Docusaurus bug, no locale config found for locale=${locale}`,
      );
    }
    return localeConfig;
  };
  const sameDomainUrl = (sitePath) => `pathname://${sitePath}`;
  const defaultUrlForLocale = (locale) => {
    const localeConfig = getLocaleConfig(locale);
    const isSameDomain = localeConfig.url === siteConfig.url;
    if (isSameDomain) {
      return sameDomainUrl(alternatePageUtils.createUrl({
        locale,
        fullyQualified: false,
      }));
    }
    return alternatePageUtils.createUrl({
      locale,
      fullyQualified: true,
    });
  };
  const targetUrlForLocale = (locale) => {
    if (locale === 'zh-CN' && !zhCnSignalAvailable) {
      return sameDomainUrl(zhCnRootSitePath(siteConfig.baseUrl));
    }

    if (locale !== 'zh-CN' && !zhCnSignalAvailable) {
      return sameDomainUrl(canonicalEnglishSitePath(pathname, siteConfig.baseUrl));
    }

    return defaultUrlForLocale(locale);
  };

  return {
    getURL: (locale, options) => {
      const finalSearch = mergeSearchStrings(
        [search, options.queryString],
        'append',
      );
      return `${targetUrlForLocale(locale)}${finalSearch}${hash}`;
    },
    getLabel: (locale) => {
      return getLocaleConfig(locale).label;
    },
    getLang: (locale) => {
      return getLocaleConfig(locale).htmlLang;
    },
  };
}

export default function LocaleDropdownNavbarItem({
  mobile,
  dropdownItemsBefore,
  dropdownItemsAfter,
  queryString,
  ...props
}) {
  const urls = useLocaleDropdownUrls();
  const {
    i18n: {currentLocale, locales},
  } = useDocusaurusContext();
  const localeItems = locales.map((locale) => {
    return {
      label: urls.getLabel(locale),
      lang: urls.getLang(locale),
      to: urls.getURL(locale, {queryString}),
      target: '_self',
      autoAddBaseUrl: false,
      className:
        locale === currentLocale
          ? mobile
            ? 'menu__link--active'
            : 'dropdown__link--active'
          : '',
    };
  });
  const items = [...dropdownItemsBefore, ...localeItems, ...dropdownItemsAfter];
  const dropdownLabel = mobile
    ? translate({
        message: 'Languages',
        id: 'theme.navbar.mobileLanguageDropdown.label',
        description: 'The label for the mobile language switcher dropdown',
      })
    : urls.getLabel(currentLocale);
  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={
        <>
          <IconLanguage className={styles.iconLanguage} />
          {dropdownLabel}
        </>
      }
      items={items}
    />
  );
}
