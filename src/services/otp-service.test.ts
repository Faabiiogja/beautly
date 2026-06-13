import { resetDb } from "@/test/db";
import { beforeEach, describe, expect, it } from "vitest";
import { createProfessional } from "./professional-service";
import { sendOtp, verifyOtp } from "./otp-service";

let businessId: string;

beforeEach(async () => {
  await resetDb();
  const result = await createProfessional({
    businessName: "Maria",
    slug: "maria",
    contactPhone: "1",
    email: "maria@beautly.com",
    password: "senha123",
    startActive: true,
  });
  businessId = result.businessId;
});

describe("otp", () => {
  it("verifies the correct code and consumes it", async () => {
    const code = await sendOtp(businessId, "11999999999");
    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyOtp(businessId, "11999999999", code)).toBe(true);
    expect(await verifyOtp(businessId, "11999999999", code)).toBe(false);
  });

  it("rejects a wrong code", async () => {
    await sendOtp(businessId, "11999999999");
    expect(await verifyOtp(businessId, "11999999999", "000000")).toBe(false);
  });

  it("locks after too many attempts", async () => {
    const code = await sendOtp(businessId, "11999999999");
    for (let i = 0; i < 5; i++) {
      await verifyOtp(businessId, "11999999999", "111111");
    }
    expect(await verifyOtp(businessId, "11999999999", code)).toBe(false);
  });
});
