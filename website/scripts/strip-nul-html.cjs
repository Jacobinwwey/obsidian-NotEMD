const fs = require('fs');
const path = require('path');

const buildRoot = path.resolve(__dirname, '..', 'build');

function walkHtmlFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(entryPath));
      continue;
    }

    if (entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }

  return files;
}

function stripNulBytes(filePath) {
  const content = fs.readFileSync(filePath);
  const nulCount = content.filter((byte) => byte === 0).length;
  if (nulCount === 0) {
    return 0;
  }

  fs.writeFileSync(filePath, Buffer.from(content.filter((byte) => byte !== 0)));
  return nulCount;
}

let strippedCount = 0;
let touchedFileCount = 0;

for (const filePath of walkHtmlFiles(buildRoot)) {
  const fileStrippedCount = stripNulBytes(filePath);
  if (fileStrippedCount > 0) {
    strippedCount += fileStrippedCount;
    touchedFileCount += 1;
  }
}

if (strippedCount > 0) {
  console.log(`Removed ${strippedCount} NUL byte(s) from ${touchedFileCount} generated HTML file(s).`);
}
