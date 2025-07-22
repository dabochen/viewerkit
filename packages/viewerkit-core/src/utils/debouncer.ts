/**
 * Debouncer utility for ViewerKit operations
 */

export class Debouncer {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly delay: number;

  constructor(delay: number = 400) {
    this.delay = delay;
  }

  /**
   * Debounce a function call
   * @param fn Function to debounce
   */
  debounce(fn: () => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      fn();
      this.timeoutId = null;
    }, this.delay);
  }

  /**
   * Cancel any pending debounced call
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Check if there's a pending debounced call
   */
  isPending(): boolean {
    return this.timeoutId !== null;
  }

  /**
   * Execute immediately and cancel any pending call
   */
  flush(fn: () => void): void {
    this.cancel();
    fn();
  }
}
