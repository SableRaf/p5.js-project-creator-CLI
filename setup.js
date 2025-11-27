// p5.js Project Setup
// Main entry point for configuring p5.js version and delivery mode

import { access } from 'fs/promises';
import * as p from '@clack/prompts';
import { FileManager } from './file/FileManager.js';
import { VersionProvider } from './api/VersionProvider.js';

const fileManager = new FileManager();
const versionProvider = new VersionProvider('p5');

async function loadConfig() {
  // Check if config file exists
  try {
    await access('p5-config.json');
    return await fileManager.readJSON('p5-config.json');
  } catch (error) {
    // Config doesn't exist
    return null;
  }
}

async function fetchVersions() {
  // Fetch available p5.js versions from API
  const versions = await versionProvider.getVersions();

  console.log('Available p5.js versions:', versions.slice(0, 10)); // Log first 10
  console.log(`Total versions available: ${versions.length}`);

  return versions;
}

async function downloadP5(version) {
  // Create lib directory if it doesn't exist
  await fileManager.createDir('lib');

  // Download p5.js from jsdelivr CDN
  const url = `https://cdn.jsdelivr.net/npm/p5@${version}/lib/p5.js`;
  await fileManager.downloadFile(url, 'lib/p5.js');

  console.log(`✓ Downloaded p5.js ${version} to lib/p5.js`);
}

async function downloadTypes(version) {
  // Create types directory if it doesn't exist
  await fileManager.createDir('types');

  // Try to download @types/p5 matching the p5.js version
  let url = `https://cdn.jsdelivr.net/npm/@types/p5@${version}/index.d.ts`;
  let response = await fileManager.downloadFileWithCheck(url);
  let typeDefsVersion = version;

  // If version not found, fallback to latest
  if (!response.ok) {
    console.log(`Type definitions for version ${version} not found, using latest...`);

    // Fetch latest version of @types/p5
    typeDefsVersion = await versionProvider.getLatestForPackage('@types/p5');

    // Download latest version
    url = `https://cdn.jsdelivr.net/npm/@types/p5@${typeDefsVersion}/index.d.ts`;
    response = await fileManager.downloadFileWithCheck(url);
  }

  const typeDefs = await response.text();

  // Save to types/global.d.ts
  await fileManager.writeHTML('types/global.d.ts', typeDefs);

  console.log(`✓ Downloaded type definitions (${typeDefsVersion}) to types/global.d.ts`);

  return typeDefsVersion;
}

async function saveConfig(version, mode = 'cdn', typeDefsVersion = null) {
  // Create configuration object
  const config = {
    version,
    mode,
    typeDefsVersion,
    lastUpdated: new Date().toISOString()
  };

  // Write to p5-config.json
  await fileManager.writeJSON('p5-config.json', config);

  console.log('✓ Configuration saved to p5-config.json');
}

async function updateHTML(version, mode) {
  // Read index.html
  const htmlContent = await fileManager.readHTML();

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
  await fileManager.writeHTML('index.html', updatedHTML);

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

  // Download type definitions (returns actual version downloaded)
  const typeDefsVersion = await downloadTypes(selectedVersion);

  await updateHTML(selectedVersion, selectedMode);
  await saveConfig(selectedVersion, selectedMode, typeDefsVersion);

  p.outro('Setup complete! Run "npm run serve" to start coding.');
}

main().catch(console.error);
