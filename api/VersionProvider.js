// VersionProvider - Handles version fetching from jsdelivr API
export class VersionProvider {
  constructor(packageName = 'p5') {
    this.packageName = packageName;
    this.baseUrl = 'https://data.jsdelivr.com/v1/package/npm';
  }

  /**
   * Get all available versions for the package
   */
  async getVersions() {
    const response = await fetch(`${this.baseUrl}/${this.packageName}`);
    const data = await response.json();
    return data.versions;
  }

  /**
   * Get the latest version for the package
   */
  async getLatest() {
    const response = await fetch(`${this.baseUrl}/${this.packageName}`);
    const data = await response.json();
    return data.tags.latest;
  }

  /**
   * Get available versions for a specific package (useful for @types/p5)
   */
  async getVersionsForPackage(packageName) {
    const response = await fetch(`${this.baseUrl}/${packageName}`);
    const data = await response.json();
    return data.versions;
  }

  /**
   * Get latest version for a specific package
   */
  async getLatestForPackage(packageName) {
    const response = await fetch(`${this.baseUrl}/${packageName}`);
    const data = await response.json();
    return data.tags.latest;
  }
}
