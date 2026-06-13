import { MockOtpSender } from "@/adapters/mock-otp-sender";
import type { OtpSender } from "@/ports/otp-sender";

// Trocar por Twilio/WhatsApp quando a integracao entrar.
export const otpSender: OtpSender = new MockOtpSender();
