// FileManager - Handles all file system operations
import { readFile, writeFile, mkdir } from 'fs/promises';

export class FileManager {
  /**
   * Read HTML file content
   */
  async readHTML(path = 'index.html') {
    return await readFile(path, 'utf-8');
  }

  /**
   * Write HTML file content
   */
  async writeHTML(path = 'index.html', content) {
    await writeFile(path, content, 'utf-8');
  }

  /**
   * Create directory (recursive)
   */
  async createDir(path) {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      // Directory already exists, ignore
    }
  }

  /**
   * Download file from URL and save to path
   */
  async downloadFile(url, targetPath) {
    const response = await fetch(url);
    const content = await response.text();
    await writeFile(targetPath, content, 'utf-8');
    return content;
  }

  /**
   * Download file from URL with response status check
   */
  async downloadFileWithCheck(url) {
    const response = await fetch(url);
    return {
      ok: response.ok,
      text: async () => await response.text()
    };
  }

  /**
   * Write JSON file
   */
  async writeJSON(path, data) {
    await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Read JSON file
   */
  async readJSON(path) {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  }
}
