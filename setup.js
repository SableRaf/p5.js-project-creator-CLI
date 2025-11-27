// p5.js Project Setup
// Main entry point for configuring p5.js version and delivery mode

import { readFile, writeFile, access } from 'fs/promises';
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

async function updateHTML(version) {
  // Read index.html
  const htmlPath = 'index.html';
  const htmlContent = await readFile(htmlPath, 'utf-8');

  // Create CDN script tag with selected version
  const scriptTag = `<script src="https://cdn.jsdelivr.net/npm/p5@${version}/lib/p5.js"></script>`;

  // Replace marker with script tag
  const updatedHTML = htmlContent.replace('<!-- P5JS_SCRIPT_TAG -->', scriptTag);

  // Write back to file
  await writeFile(htmlPath, updatedHTML, 'utf-8');

  console.log(`✓ Updated index.html with p5.js ${version} CDN link`);
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

  await updateHTML(selectedVersion);
  await saveConfig(selectedVersion, 'cdn');

  p.outro('Setup complete! Run "npm run serve" to start coding.');
}

main().catch(console.error);
