// p5.js Project Setup
// Main entry point for configuring p5.js version and delivery mode

import { readFile, writeFile } from 'fs/promises';
import * as p from '@clack/prompts';

async function updateHTML() {
  // Read index.html
  const htmlPath = 'index.html';
  const htmlContent = await readFile(htmlPath, 'utf-8');

  // Hardcoded p5.js CDN link (version 2.1.1)
  const scriptTag = '<script src="https://cdn.jsdelivr.net/npm/p5@2.1.1/lib/p5.js"></script>';

  // Replace marker with script tag
  const updatedHTML = htmlContent.replace('<!-- P5JS_SCRIPT_TAG -->', scriptTag);

  // Write back to file
  await writeFile(htmlPath, updatedHTML, 'utf-8');

  console.log('✓ Updated index.html with p5.js 2.1.1 CDN link');
}

async function main() {
  p.intro('p5.js Project Setup');

  const ready = await p.confirm({
    message: 'Ready to setup?'
  });

  if (p.isCancel(ready) || !ready) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }

  await updateHTML();

  p.outro('Setup complete! Run "npm run serve" to start coding.');
}

main().catch(console.error);
