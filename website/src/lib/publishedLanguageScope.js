import {publishedZhCnDocs, zhCnCriticalDocPaths, zhCnHomepageDocPaths} from './publishedLanguageScopeData.mjs';

export {publishedZhCnDocs, zhCnCriticalDocPaths, zhCnHomepageDocPaths};

export function normalizeDocPath(docPath) {
  const normalizedPath = docPath.startsWith('/') ? docPath : `/${docPath}`;
  return normalizedPath.replace(/\/$/, '');
}

export const publishedZhCnDocIds = new Set(publishedZhCnDocs.map(({id}) => id));
export const publishedZhCnDocPaths = new Set(publishedZhCnDocs.map(({path}) => normalizeDocPath(path)));

export function isPublishedZhCnDocId(docId) {
  return publishedZhCnDocIds.has(docId);
}

export function isPublishedZhCnDocPath(docPath) {
  return publishedZhCnDocPaths.has(normalizeDocPath(docPath));
}

export function zhCnDocSourcePathForId(docId) {
  return publishedZhCnDocs.find((doc) => doc.id === docId)?.sourcePath;
}
