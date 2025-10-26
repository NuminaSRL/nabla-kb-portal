// Quota reset scheduler service
import { quotaManager } from './quota-manager';

export class QuotaScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Start the quota reset scheduler
   * Runs daily at midnight UTC
   */
  start(): void {
    if (this.isRunning) {
      console.log('Quota scheduler is already running');
      return;
    }

    console.log('Starting quota reset scheduler...');
    this.isRunning = true;

    // Calculate time until next midnight UTC
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    // Schedule first reset at midnight
    setTimeout(() => {
      this.executeReset();

      // Then schedule daily resets
      this.intervalId = setInterval(() => {
        this.executeReset();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilMidnight);

    console.log(`Quota scheduler started. Next reset in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  }

  /**
   * Stop the quota reset scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Quota scheduler stopped');
  }

  /**
   * Execute quota reset
   */
  private async executeReset(): Promise<void> {
    const startTime = Date.now();
    console.log('Executing daily quota reset...');

    try {
      const result = await quotaManager.resetDailyQuotas();
      const executionTime = Date.now() - startTime;

      console.log(
        `Quota reset completed: ${result.users_reset} users, ${result.quotas_reset} quotas reset in ${executionTime}ms`
      );
    } catch (err) {
      console.error('Error executing quota reset:', err);
    }
  }

  /**
   * Manually trigger a reset (for testing)
   */
  async manualReset(): Promise<void> {
    console.log('Manually triggering quota reset...');
    await this.executeReset();
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; nextReset: Date | null } {
    const nextReset = this.isRunning ? this.calculateNextReset() : null;
    return {
      running: this.isRunning,
      nextReset,
    };
  }

  /**
   * Calculate next reset time
   */
  private calculateNextReset(): Date {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    return nextMidnight;
  }
}

// Export singleton instance
export const quotaScheduler = new QuotaScheduler();

// Auto-start scheduler in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_QUOTA_SCHEDULER === 'true') {
  quotaScheduler.start();
}

