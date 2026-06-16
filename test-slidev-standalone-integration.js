#!/usr/bin/env node
/**
 * Integration test for Slidev standalone bundle export
 * Tests the new --standalone-bundle flag with real markdown files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SLIDEV_BIN = '/home/jacob/slidev/packages/slidev/bin/slidev.mjs';
const TEST_DIR = path.join(__dirname, 'docs/export/test-standalone-integration');
const TEST_MD = path.join(TEST_DIR, 'test-slides.md');

// Test markdown content
const testContent = `---
theme: default
class: text-center
highlighter: shiki
title: Integration Test Slides
---

# Integration Test

Testing Slidev standalone bundle with obsidian-NotEMD

---

# Code Example

\`\`\`typescript
interface User {
  id: number;
  name: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

---

# Vue Components

<div v-click>
  <strong>Click animations work!</strong>
</div>

---

# Mermaid Diagram

\`\`\`mermaid
graph TD
  A[Start] --> B[Process]
  B --> C[End]
\`\`\`

---

# Final Slide

✅ Test complete!
`;

console.log('🧪 Slidev Standalone Bundle Integration Test\n');

// Create test directory
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  console.log('✅ Created test directory');
}

// Write test markdown
fs.writeFileSync(TEST_MD, testContent);
console.log('✅ Created test markdown file');

// Run Slidev build with --standalone-bundle
console.log('\n📦 Building standalone bundle...');
try {
  const startTime = Date.now();
  const output = execSync(
    `node ${SLIDEV_BIN} build --standalone-bundle --out dist ${TEST_MD}`,
    { cwd: TEST_DIR, encoding: 'utf-8' }
  );
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Build completed in ${duration}s`);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Verify output files
const distDir = path.join(TEST_DIR, 'dist');
const standaloneHtml = path.join(distDir, 'index-standalone.html');
const regularHtml = path.join(distDir, 'index.html');

console.log('\n🔍 Verifying output files...');

if (!fs.existsSync(standaloneHtml)) {
  console.error('❌ index-standalone.html not found');
  process.exit(1);
}
console.log('✅ index-standalone.html exists');

if (!fs.existsSync(regularHtml)) {
  console.error('❌ index.html not found');
  process.exit(1);
}
console.log('✅ index.html exists');

// Read and analyze standalone bundle
const htmlContent = fs.readFileSync(standaloneHtml, 'utf-8');
const htmlSize = (fs.statSync(standaloneHtml).size / 1024).toFixed(2);

console.log(`\n📊 Standalone Bundle Analysis:`);
console.log(`   Size: ${htmlSize} KB`);

// Check for critical features
const checks = [
  { name: 'Bundle mode marker', pattern: 'slidev-bundle-mode', required: true },
  { name: 'Module loader (__require)', pattern: '__require', required: true },
  { name: 'Critical export fix', pattern: 'module.exports.default=module.exports=', required: true },
  { name: 'No external scripts', pattern: '<script[^>]*src=', inverse: true },
  { name: 'No local CSS links', pattern: '<link[^>]*rel="stylesheet"[^>]*crossorigin', inverse: true },
  { name: 'No external preload links', pattern: '<link[^>]*rel="preload"[^>]*href="https?://', inverse: true },
  { name: 'No CSS preload errors', pattern: 'Unable to preload CSS', inverse: true },
  { name: 'Vue component code', pattern: 'Vue', required: true },
  { name: 'Slide content', pattern: 'Integration Test', required: true },
  { name: 'Inline scripts present', pattern: '<script type="text/javascript">', required: true },
  { name: 'Google Fonts allowed', pattern: 'fonts.googleapis.com', required: false },
];

console.log('\n✨ Feature Verification:');
let allPassed = true;

for (const check of checks) {
  const regex = new RegExp(check.pattern);
  const found = regex.test(htmlContent);
  const passed = check.inverse ? !found : found;
  
  if (passed) {
    console.log(`   ✅ ${check.name}`);
  } else {
    console.log(`   ❌ ${check.name} - ${check.inverse ? 'should not exist' : 'not found'}`);
    if (check.required) allPassed = false;
  }
}

// Compare sizes
const regularSize = (fs.statSync(regularHtml).size / 1024).toFixed(2);
const sizeIncrease = ((htmlSize / regularSize - 1) * 100).toFixed(1);

console.log(`\n📏 Size Comparison:`);
console.log(`   Regular HTML: ${regularSize} KB`);
console.log(`   Standalone: ${htmlSize} KB`);
console.log(`   Increase: ${sizeIncrease}%`);

// Test if it can be opened
console.log('\n🌐 File Protocol Test:');
console.log(`   file://${standaloneHtml}`);
console.log('   ℹ️  Open this URL in a browser to verify it works offline');

if (allPassed) {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed\n');
  process.exit(1);
}
