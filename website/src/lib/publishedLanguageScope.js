export const publishedZhCnDocIds = new Set(['faq']);
export const publishedZhCnDocPaths = new Set(['/docs/faq']);

export function isPublishedZhCnDocId(docId) {
  return publishedZhCnDocIds.has(docId);
}

export function isPublishedZhCnDocPath(docPath) {
  const normalizedPath = docPath.startsWith('/') ? docPath : `/${docPath}`;
  return publishedZhCnDocPaths.has(normalizedPath.replace(/\/$/, ''));
}
