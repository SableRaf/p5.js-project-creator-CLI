// PromptProvider - Handles all user prompts and interactions
import * as p from '@clack/prompts';

export class PromptProvider {
  /**
   * Show intro message
   */
  intro(message) {
    p.intro(message);
  }

  /**
   * Show outro message
   */
  outro(message) {
    p.outro(message);
  }

  /**
   * Show note message
   */
  note(message, title) {
    p.note(message, title);
  }

  /**
   * Show cancellation message and exit
   */
  cancel(message) {
    p.cancel(message);
  }

  /**
   * Check if user cancelled
   */
  isCancel(value) {
    return p.isCancel(value);
  }

  /**
   * Confirm prompt
   */
  async confirm(message) {
    return await p.confirm({ message });
  }

  /**
   * Select version from list
   */
  async selectVersion(versions, count = 15) {
    return await p.select({
      message: 'Select p5.js version:',
      options: versions.slice(0, count).map(v => ({ value: v, label: v })),
    });
  }

  /**
   * Select delivery mode (CDN or Local)
   */
  async selectMode() {
    return await p.select({
      message: 'Choose delivery mode:',
      options: [
        { value: 'cdn', label: 'CDN (jsdelivr)' },
        { value: 'local', label: 'Local (download to lib/)' }
      ],
    });
  }

  /**
   * Generic select prompt
   */
  async select(message, options) {
    return await p.select({ message, options });
  }
}
