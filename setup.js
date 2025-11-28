// p5.js Project Setup
// Main entry point for configuring p5.js version and delivery mode

import { FileManager } from './src/file/FileManager.js';
import { HTMLManager } from './src/file/HTMLManager.js';
import { VersionProvider } from './src/api/VersionProvider.js';
import { ConfigManager } from './src/config/ConfigManager.js';
import { PromptProvider } from './src/ui/PromptProvider.js';

const fileManager = new FileManager();
const htmlManager = new HTMLManager();
const versionProvider = new VersionProvider('p5');
const configManager = new ConfigManager(fileManager);
const promptProvider = new PromptProvider();

const basePath = 'sketch/';

// Check for verbose flag (supports both direct Node and npm scripts)
const verbose = process.argv.includes('--verbose') || 
                process.env.npm_config_verbose === 'true';

async function fetchVersions() {
  // Fetch available p5.js versions from API
  const versions = await versionProvider.getVersions();

  if (verbose) {
    console.log(`Total versions available: ${versions.length}`);
    console.log('Showing most recent versions...');
  }

  return versions;
}

async function downloadP5(version, verbose = false) {
  // Create lib directory if it doesn't exist
  await fileManager.createDir(`${basePath}lib`);

  // Download p5.js from jsdelivr CDN
  const url = `https://cdn.jsdelivr.net/npm/p5@${version}/lib/p5.js`;
  await fileManager.downloadFile(url, `${basePath}lib/p5.js`);

  if (verbose) {
    console.log(`✓ Downloaded p5.js ${version} to ${basePath}lib/p5.js`);
  }
}

// Delete existing p5.js type definition files matching p5.js.*.d.ts in the types directory
async function deleteExistingTypeDefinitions(basePath, verbose = false) {
  const typesDir = `${basePath}types`;
  const typesExist = await fileManager.exists(typesDir);
  if (typesExist) {
    const typeFiles = await fileManager.listDir(typesDir);
    for (const file of typeFiles) {
      if (/^p5\.js.*\.d\.ts$/.test(file)) {
        const filePath = `${typesDir}/${file}`;
        const deleted = await fileManager.deleteFile(filePath);
        if (verbose) {
          if (deleted) console.log(`✓ Deleted existing type definition \`${filePath}\``);
          else console.warn(`⚠ Could not delete existing type definition \`${filePath}\``);
        }
      }
    }
  }
}

// Example format for URL:
// https://cdn.jsdelivr.net/npm/p5@2.1.1/types/global.d.ts
// Fall back to latest if specific version not found:
// https://cdn.jsdelivr.net/npm/p5@latest/types/global.d.ts
async function downloadTypes(version, verbose = false) {
  // Create types directory if it doesn't exist
  await fileManager.createDir(`${basePath}types`);

  // Try to download p5 type definitions matching the p5.js version
  let url = `https://cdn.jsdelivr.net/npm/p5@${version}/types/global.d.ts`;
  let response = await fileManager.downloadFileWithCheck(url);
  let typeDefsVersion = version;

  // If version not found, fallback to latest
  if (!response.ok) {
    if (verbose) {
      console.log(`Type definitions for version ${version} not found, using latest...`);
    }
    // Fetch latest version of p5
    typeDefsVersion = await versionProvider.getLatestForPackage('p5');
    // Download latest version
    url = `https://cdn.jsdelivr.net/npm/p5@${typeDefsVersion}/types/global.d.ts`;
    response = await fileManager.downloadFileWithCheck(url);
  }

  const typeDefs = await response.text();

  // Save to types/global.d.ts
  await fileManager.writeHTML(`${basePath}types/p5.js@${typeDefsVersion}.d.ts`, typeDefs);

  if (verbose) {
    console.log(`✓ Downloaded type definitions (${typeDefsVersion}) to types/p5.js@${typeDefsVersion}.d.ts`);
  }

  return typeDefsVersion;
}

async function updateHTML(version, mode, verbose = false) {
  // Read index.html
  const htmlContent = await fileManager.readHTML();

  // Update p5.js script tag using DOM parsing
  const result = htmlManager.updateP5Script(htmlContent, version, mode);

  // Write back to file
  await fileManager.writeHTML(`${basePath}index.html`, result.html);

  if (result.updated) {
    if (verbose) {
      console.log(`✓ Updated index.html with p5.js ${version} (${mode} mode)`);
      console.log(`      Method: ${result.method}`);
    }
  } else {
    if (verbose) {
      console.warn('⚠ Warning: Could not update index.html');
    }
  }
}

async function main() {
    // Ensure sketch directory and required files exist
    await fileManager.createDir(basePath);
    const requiredFiles = [
      { name: 'index.html', content: `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <script src=\"https://cdn.jsdelivr.net/npm/p5@2.1.0/lib/p5.js\"></script>\n  <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\">\n</head>\n<body>\n  <main></main>\n  <script src=\"sketch.js\"></script>\n</body>\n</html>\n` },
      { name: 'sketch.js', content: `function setup() {\n  createCanvas(400, 400);\n  background(220);\n}\n\nfunction draw() {\n  circle(mouseX, mouseY, 20);\n}\n` },
      { name: 'style.css', content: `html, body {\n  margin: 0;\n  padding: 0;\n}\n\ncanvas {\n  display: block;\n}\n` },
      { name: 'jsconfig.json', content: `{\n  "compilerOptions": {\n    "target": "ES6"\n  },\n  "include": [\n    "*.js",\n    "types/*.d.ts"\n  ]\n}` },
    ];
    for (const file of requiredFiles) {
      const filePath = `${basePath}${file.name}`;
      const exists = await fileManager.exists(filePath);
      if (!exists) {
        await fileManager.writeHTML(filePath, file.content);
        console.log(`✓ Created missing file: ${filePath}`);
      }
    }
  promptProvider.intro('p5.js Project Setup');

  // Load existing config if it exists
  const config = await configManager.load();

  let selectedVersion;

  if (config) {
    // Show current configuration
    promptProvider.note(`Current: p5.js ${config.version} (${config.mode} mode)`, 'Existing Configuration');

    const changeConfig = await promptProvider.confirm('Do you want to change the version?');

    if (promptProvider.isCancel(changeConfig)) {
      promptProvider.cancel('Setup cancelled');
      process.exit(0);
    }

    if (!changeConfig) {
      promptProvider.outro('Keeping current configuration.');
      process.exit(0);
    }
  }

  // Fetch available versions
  const versions = await fetchVersions();

  // Let user select a version
  selectedVersion = await promptProvider.selectVersion(versions);

  if (promptProvider.isCancel(selectedVersion)) {
    promptProvider.cancel('Setup cancelled');
    process.exit(0);
  }

  // Let user select delivery mode
  const selectedMode = await promptProvider.selectMode();

  if (promptProvider.isCancel(selectedMode)) {
    promptProvider.cancel('Setup cancelled');
    process.exit(0);
  }

  // If switching from local to CDN, offer to delete the local copy
  if (config && config.mode === 'local' && selectedMode !== 'local') {
    const confirmDelete = await promptProvider.confirm('You are switching from local to CDN. Delete the local file `lib/p5.js`?');

    if (promptProvider.isCancel(confirmDelete)) {
      promptProvider.cancel('Setup cancelled');
      process.exit(0);
    }

    if (confirmDelete) {
      const p5Path = `${basePath}lib/p5.js`;
      const exists = await fileManager.exists(p5Path);

      if (exists) {
        const deleted = await fileManager.deleteFile(p5Path);
        if(verbose) {
          if (deleted) console.log(`✓ Deleted local file \`${basePath}lib/p5.js\``);
          else if (!deleted) console.warn(`⚠ Could not delete \`${basePath}lib/p5.js\``);
        }
      } else {
        if (verbose) console.log(`No local \`${basePath}lib/p5.js\` found to delete.`);
      }

      // If lib directory is now empty, ask to delete it
      const libContents = await fileManager.listDir(`${basePath}lib`);
      if (!libContents || libContents.length === 0) {
        const confirmDeleteLib = await promptProvider.confirm('The `lib` folder is empty. Delete the `lib` folder as well?');

        if (promptProvider.isCancel(confirmDeleteLib)) {
          promptProvider.cancel('Setup cancelled');
          process.exit(0);
        }

        if (confirmDeleteLib) {
          const removed = await fileManager.deleteDir(`${basePath}lib`);
          if (verbose) {
            if (removed) console.log(`✓ Deleted \`${basePath}lib\` folder`);
            else console.warn(`⚠ Could not delete \`${basePath}lib\` folder`);
          }
        }
      }
    }
  }

  // Download p5.js if local mode
  if (selectedMode === 'local') {
    await downloadP5(selectedVersion, verbose);
  }

  // Delete existing p5.js type definitions before downloading new ones
  await deleteExistingTypeDefinitions(basePath, verbose);

  // Download type definitions (returns actual version downloaded)
  const typeDefsVersion = await downloadTypes(selectedVersion, verbose);

  await updateHTML(selectedVersion, selectedMode, verbose);
  await configManager.save(selectedVersion, selectedMode, typeDefsVersion);
  if (verbose) {
    console.log(`✓ Configuration saved to \`${basePath}p5-config.json\`` );
  }

  promptProvider.outro('Setup complete! Run "npm run serve" to run a local server and open sketch/sketch.js to start coding.');
}

main().catch(console.error);
