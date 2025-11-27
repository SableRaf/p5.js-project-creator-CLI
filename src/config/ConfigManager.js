// ConfigManager - Handles project configuration
import { access } from 'fs/promises';

export class ConfigManager {
  constructor(fileManager, configPath = 'p5-config.json') {
    this.fileManager = fileManager;
    this.configPath = configPath;
  }

  /**
   * Load configuration from file
   * Returns null if config doesn't exist
   */
  async load() {
    try {
      await access(this.configPath);
      return await this.fileManager.readJSON(this.configPath);
    } catch (error) {
      // Config doesn't exist
      return null;
    }
  }

  /**
   * Save configuration to file
   */
  async save(version, mode = 'cdn', typeDefsVersion = null) {
    const config = {
      version,
      mode,
      typeDefsVersion,
      lastUpdated: new Date().toISOString()
    };

    await this.fileManager.writeJSON(this.configPath, config);
  }

  /**
   * Get default configuration
   */
  getDefault() {
    return {
      version: 'latest',
      mode: 'cdn',
      typeDefsVersion: null,
      lastUpdated: new Date().toISOString()
    };
  }
}

