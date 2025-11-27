// Dry-run test script for lib deletion logic
// This script creates a temporary workspace under ./test-temp,
// creates a `lib/p5.js` file, and then runs the deletion logic in dry-run
// and real modes so you can verify behavior without touching the main repo.

import { mkdir, writeFile, rm, rmdir } from 'fs/promises';
import { spawn } from 'child_process';
import { FileManager } from '../file/FileManager.js';

async function setupTemp() {
  // create test-temp/lib and a dummy p5.js
  await mkdir('test-temp/lib', { recursive: true });
  await writeFile('test-temp/lib/p5.js', '// dummy p5', 'utf-8');
}

async function cleanupTemp() {
  try {
    await rm('test-temp', { recursive: true, force: true });
  } catch (e) {}
}

async function runDryRunSimulation() {
  console.log('Setting up test-temp workspace...');
  await cleanupTemp();
  await setupTemp();

  // Use FileManager pointed at current CWD (test-temp)
  const fm = new FileManager();

  // Simulate dry-run: report what would be deleted
  const p5Path = 'test-temp/lib/p5.js';
  const libDir = 'test-temp/lib';

  const exists = await fm.exists(p5Path);
  console.log('p5 exists:', exists);

  console.log('\n-- Dry run (no deletions) --');
  if (exists) {
    console.log(`Would delete ${p5Path}`);
  }

  const libContents = await fm.listDir(libDir);
  console.log('lib contents:', libContents);
  if (!libContents || libContents.length === 0) {
    console.log(`Would delete ${libDir}`);
  } else {
    console.log(`${libDir} is not empty; would not delete in dry run.`);
  }

  console.log('\n-- Real run (perform deletions) --');
  if (exists) {
    const deleted = await fm.deleteFile(p5Path);
    console.log('Deleted p5.js:', deleted);
  }

  const libContentsAfter = await fm.listDir(libDir);
  console.log('lib contents after deleting p5.js:', libContentsAfter);
  if (!libContentsAfter || libContentsAfter.length === 0) {
    const removed = await fm.deleteDir(libDir);
    console.log('Deleted lib dir:', removed);
  }

  // Clean up base folder
  await cleanupTemp();
  console.log('\nDry-run test completed.');
}

runDryRunSimulation().catch(err => {
  console.error(err);
  process.exit(1);
});
