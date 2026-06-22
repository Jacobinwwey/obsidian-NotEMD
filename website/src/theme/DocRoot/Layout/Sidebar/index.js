import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import OriginalDocRootLayoutSidebar from '@theme-original/DocRoot/Layout/Sidebar';
import {docPathFromSidebarHref} from '../../../../lib/languageRoutePolicy';
import {isPublishedZhCnDocPath} from '../../../../lib/publishedLanguageScope';

function filterSidebarItems(items, baseUrl) {
  return items.flatMap((item) => {
    if (item.type === 'link') {
      const docPath = docPathFromSidebarHref(item.href, baseUrl);
      return !docPath || isPublishedZhCnDocPath(docPath) ? [item] : [];
    }

    if (item.type === 'category') {
      const filteredItems = filterSidebarItems(item.items ?? [], baseUrl);
      if (filteredItems.length === 0) {
        return [];
      }

      const categoryDocPath = docPathFromSidebarHref(item.href, baseUrl);
      return [{
        ...item,
        href: categoryDocPath && !isPublishedZhCnDocPath(categoryDocPath) ? undefined : item.href,
        items: filteredItems,
      }];
    }

    return [item];
  });
}

export default function DocRootLayoutSidebar(props) {
  const {
    siteConfig,
    i18n: {currentLocale},
  } = useDocusaurusContext();
  const sidebar = currentLocale === 'zh-CN'
    ? filterSidebarItems(props.sidebar, siteConfig.baseUrl)
    : props.sidebar;
  return <OriginalDocRootLayoutSidebar {...props} sidebar={sidebar} />;
}
