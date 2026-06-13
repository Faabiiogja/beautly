import { describe, expect, it, vi } from "vitest";
import { MockOtpSender } from "./mock-otp-sender";

describe("MockOtpSender", () => {
  it("logs the code and records the last sent message", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const sender = new MockOtpSender();

    await sender.send("11999999999", "123456");

    expect(sender.lastSent).toEqual({ phone: "11999999999", code: "123456" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
