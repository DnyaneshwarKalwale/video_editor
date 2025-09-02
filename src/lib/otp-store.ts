// Shared OTP store for email verification
export interface OTPData {
  otp: string;
  expiresAt: Date;
  attempts: number;
}

class OTPStore {
  private store = new Map<string, OTPData>();

  // Set OTP for an email
  set(email: string, otpData: OTPData): void {
    this.store.set(email, otpData);
  }

  // Get OTP data for an email
  get(email: string): OTPData | undefined {
    return this.store.get(email);
  }

  // Delete OTP for an email
  delete(email: string): boolean {
    return this.store.delete(email);
  }

  // Check if email has OTP
  has(email: string): boolean {
    return this.store.has(email);
  }

  // Cleanup expired OTPs
  cleanup(): void {
    const now = new Date();
    for (const [email, otpData] of this.store.entries()) {
      if (otpData.expiresAt < now) {
        this.store.delete(email);
      }
    }
  }

  // Get store size (for debugging)
  size(): number {
    return this.store.size;
  }
}

// Export singleton instance
export const otpStore = new OTPStore();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  otpStore.cleanup();
}, 5 * 60 * 1000);
