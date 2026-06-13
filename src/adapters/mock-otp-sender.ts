import type { OtpSender } from "@/ports/otp-sender";

/** Adapter de desenvolvimento: imprime o código no console. */
export class MockOtpSender implements OtpSender {
  lastSent: { phone: string; code: string } | null = null;

  async send(phone: string, code: string): Promise<void> {
    this.lastSent = { phone, code };
    console.log(`[OTP] para ${phone}: ${code}`);
  }
}
