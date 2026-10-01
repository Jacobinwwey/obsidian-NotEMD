function selectHomepageCopy(catalog, locale) {
  const copy = catalog[locale];
  if (!copy || typeof copy !== 'object' || Array.isArray(copy)) {
    throw new Error(`Homepage ${locale}: missing authored copy`);
  }

  // Locale completeness is a publication invariant; field-level English fallback
  // would hide missing translations in an otherwise successful static build.
  const textFields = [
    'title', 'description', 'eyebrow', 'heading', 'lead', 'primary', 'secondary',
    'faq', 'audienceHeading', 'exampleHeading', 'sourceLabel', 'outputLabel',
    'exampleSource', 'exampleOutput', 'exampleNote', 'factHeading',
    'releaseHeading', 'releaseBody', 'releaseLink', 'retrievalHeading',
    'retrievalLead', 'languageBoundary',
  ];
  const textEntries = textFields.map(field => [field, copy[field]]);
  for (const [section, fields] of [
    ['sections', ['title', 'body', 'href']],
    ['facts', ['label', 'value']],
    ['retrievalLinks', ['title', 'body', 'href']],
  ]) {
    if (!Array.isArray(copy[section]) || copy[section].length === 0) {
      throw new Error(`Homepage ${locale}: missing ${section}`);
    }
    copy[section].forEach((entry, index) => {
      for (const field of fields) {
        textEntries.push([`${section}[${index}].${field}`, entry?.[field]]);
      }
    });
  }
  for (const [field, text] of textEntries) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error(`Homepage ${locale}: missing ${field}`);
    }
  }
  return copy;
}

module.exports = {selectHomepageCopy};
