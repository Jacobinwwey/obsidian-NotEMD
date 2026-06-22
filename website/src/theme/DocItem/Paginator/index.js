import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import DocPaginator from '@theme/DocPaginator';
import {docPathFromSidebarHref} from '../../../lib/languageRoutePolicy';
import {isPublishedZhCnDocPath} from '../../../lib/publishedLanguageScope';

function visibleZhCnPaginationTarget(target, baseUrl) {
  if (!target) {
    return undefined;
  }

  const docPath = docPathFromSidebarHref(target.permalink, baseUrl);
  return !docPath || isPublishedZhCnDocPath(docPath) ? target : undefined;
}

export default function DocItemPaginator() {
  const {metadata} = useDoc();
  const {
    siteConfig,
    i18n: {currentLocale},
  } = useDocusaurusContext();
  const previous = currentLocale === 'zh-CN'
    ? visibleZhCnPaginationTarget(metadata.previous, siteConfig.baseUrl)
    : metadata.previous;
  const next = currentLocale === 'zh-CN'
    ? visibleZhCnPaginationTarget(metadata.next, siteConfig.baseUrl)
    : metadata.next;

  return (
    <DocPaginator
      className="docusaurus-mt-lg"
      previous={previous}
      next={next}
    />
  );
}
