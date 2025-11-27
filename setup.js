// p5.js Project Setup
// Main entry point for configuring p5.js version and delivery mode

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import * as p from '@clack/prompts';

async function loadConfig() {
  // Check if config file exists
  try {
    await access('p5-config.json');
    const configData = await readFile('p5-config.json', 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    // Config doesn't exist
    return null;
  }
}

async function fetchVersions() {
  // Fetch available p5.js versions from jsdelivr API
  const response = await fetch('https://data.jsdelivr.com/v1/package/npm/p5');
  const data = await response.json();

  // Extract and return versions array
  const versions = data.versions;
  console.log('Available p5.js versions:', versions.slice(0, 10)); // Log first 10
  console.log(`Total versions available: ${versions.length}`);

  return versions;
}

async function downloadP5(version) {
  // Create lib directory if it doesn't exist
  try {
    await mkdir('lib', { recursive: true });
  } catch (error) {
    // Directory already exists, ignore
  }

  // Download p5.js from jsdelivr CDN
  const url = `https://cdn.jsdelivr.net/npm/p5@${version}/lib/p5.js`;
  const response = await fetch(url);
  const p5Code = await response.text();

  // Save to lib/p5.js
  await writeFile('lib/p5.js', p5Code, 'utf-8');

  console.log(`✓ Downloaded p5.js ${version} to lib/p5.js`);
}

async function downloadTypes(version) {
  // Create types directory if it doesn't exist
  try {
    await mkdir('types', { recursive: true });
  } catch (error) {
    // Directory already exists, ignore
  }

  // Download @types/p5 from jsdelivr CDN
  // For now, use the version as-is (will add fallback in next commit)
  const url = `https://cdn.jsdelivr.net/npm/@types/p5@${version}/index.d.ts`;
  const response = await fetch(url);
  const typeDefs = await response.text();

  // Save to types/global.d.ts
  await writeFile('types/global.d.ts', typeDefs, 'utf-8');

  console.log(`✓ Downloaded type definitions to types/global.d.ts`);
}

async function saveConfig(version, mode = 'cdn') {
  // Create configuration object
  const config = {
    version,
    mode,
    typeDefsVersion: null, // Will be added later
    lastUpdated: new Date().toISOString()
  };

  // Write to p5-config.json
  await writeFile('p5-config.json', JSON.stringify(config, null, 2), 'utf-8');

  console.log('✓ Configuration saved to p5-config.json');
}

async function updateHTML(version, mode) {
  // Read index.html
  const htmlPath = 'index.html';
  const htmlContent = await readFile(htmlPath, 'utf-8');

  // Create script tag based on mode
  let scriptTag;
  if (mode === 'cdn') {
    scriptTag = `<script src="https://cdn.jsdelivr.net/npm/p5@${version}/lib/p5.js"></script>`;
  } else {
    scriptTag = `<script src="lib/p5.js"></script>`;
  }

  // Replace marker with script tag
  const updatedHTML = htmlContent.replace('<!-- P5JS_SCRIPT_TAG -->', scriptTag);

  // Write back to file
  await writeFile(htmlPath, updatedHTML, 'utf-8');

  console.log(`✓ Updated index.html with p5.js ${version} (${mode} mode)`);
}

async function main() {
  p.intro('p5.js Project Setup');

  // Load existing config if it exists
  const config = await loadConfig();

  let selectedVersion;

  if (config) {
    // Show current configuration
    p.note(`Current: p5.js ${config.version} (${config.mode} mode)`, 'Existing Configuration');

    const changeConfig = await p.confirm({
      message: 'Do you want to change the version?'
    });

    if (p.isCancel(changeConfig)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    if (!changeConfig) {
      p.outro('Keeping current configuration.');
      process.exit(0);
    }
  }

  // Fetch available versions
  const versions = await fetchVersions();

  // Let user select a version
  selectedVersion = await p.select({
    message: 'Select p5.js version:',
    options: versions.slice(0, 15).map(v => ({ value: v, label: v })),
  });

  if (p.isCancel(selectedVersion)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }

  // Let user select delivery mode
  const selectedMode = await p.select({
    message: 'Choose delivery mode:',
    options: [
      { value: 'cdn', label: 'CDN (jsdelivr)' },
      { value: 'local', label: 'Local (download to lib/)' }
    ],
  });

  if (p.isCancel(selectedMode)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }

  // Download p5.js if local mode
  if (selectedMode === 'local') {
    await downloadP5(selectedVersion);
  }

  // Download type definitions
  await downloadTypes(selectedVersion);

  await updateHTML(selectedVersion, selectedMode);
  await saveConfig(selectedVersion, selectedMode);

  p.outro('Setup complete! Run "npm run serve" to start coding.');
}

main().catch(console.error);
