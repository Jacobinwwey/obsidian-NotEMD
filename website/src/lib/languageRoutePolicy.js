import {isPublishedZhCnDocPath, normalizeDocPath} from './publishedLanguageScope';
import {publishedDocumentationLocaleCodes} from './publishedLocales.mjs';

const localizedSitePrefixes = publishedDocumentationLocaleCodes;

function normalizeBasePath(baseUrl) {
  if (!baseUrl || baseUrl === '/') {
    return '/';
  }

  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function canonicalSiteBasePath(baseUrl) {
  let normalizedBasePath = normalizeBasePath(baseUrl);
  for (const locale of localizedSitePrefixes) {
    normalizedBasePath = normalizedBasePath.replace(new RegExp(`/${locale}/$`), '/');
  }
  return normalizedBasePath;
}

function stripBasePath(pathname, baseUrl) {
  const normalizedBasePath = canonicalSiteBasePath(baseUrl);
  if (normalizedBasePath === '/') {
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }

  if (pathname === normalizedBasePath.slice(0, -1)) {
    return '/';
  }

  if (pathname.startsWith(normalizedBasePath)) {
    return `/${pathname.slice(normalizedBasePath.length)}`;
  }

  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function stripLocalePrefix(siteRelativePath) {
  const normalizedPath = siteRelativePath.replace(/\/$/, '') || '/';
  for (const locale of localizedSitePrefixes) {
    const localePrefix = `/${locale}`;
    if (normalizedPath === localePrefix) {
      return '/';
    }

    if (normalizedPath.startsWith(`${localePrefix}/`)) {
      return normalizedPath.slice(localePrefix.length);
    }
  }

  return normalizedPath;
}

export function docPathFromSitePath(pathname, baseUrl) {
  const siteRelativePath = stripLocalePrefix(stripBasePath(pathname, baseUrl));
  if (siteRelativePath === '/docs') {
    return '/docs';
  }

  if (siteRelativePath.startsWith('/docs/')) {
    return normalizeDocPath(siteRelativePath);
  }

  return undefined;
}

export function sitePathTargetsZhCnDocs(pathname, baseUrl) {
  const siteRelativePath = stripBasePath(pathname, baseUrl).replace(/\/$/, '');
  return siteRelativePath === '/zh-CN/docs' || siteRelativePath.startsWith('/zh-CN/docs/');
}

export function sitePathTargetsUnpublishedZhCnDoc(pathname, baseUrl) {
  const docPath = docPathFromSitePath(pathname, baseUrl);
  return Boolean(docPath && sitePathTargetsZhCnDocs(pathname, baseUrl) && !isPublishedZhCnDocPath(docPath));
}

export function shouldExposeZhCnLanguageSignal(pathname, baseUrl) {
  const docPath = docPathFromSitePath(pathname, baseUrl);
  return !docPath || isPublishedZhCnDocPath(docPath);
}

export function canonicalEnglishSitePath(pathname, baseUrl) {
  const docPath = docPathFromSitePath(pathname, baseUrl);
  if (!docPath) {
    return canonicalSiteBasePath(baseUrl);
  }

  return `${canonicalSiteBasePath(baseUrl)}${docPath.slice(1)}`;
}

export function zhCnRootSitePath(baseUrl) {
  return `${canonicalSiteBasePath(baseUrl)}zh-CN/`;
}

export function docPathFromSidebarHref(href, baseUrl) {
  if (!href) {
    return undefined;
  }

  const localHref = href.startsWith('http')
    ? new URL(href).pathname
    : href.replace(/^pathname:\/\//, '');
  return docPathFromSitePath(localHref, baseUrl);
}
