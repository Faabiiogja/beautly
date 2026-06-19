import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "./csrf";

const SITE = "https://beautly.com";

function req(
  headers: Record<string, string> = {},
  url = `${SITE}/admin/logout`,
): Request {
  return new Request(url, { method: "POST", headers });
}

describe("isSameOriginRequest", () => {
  it("aceita POST com Origin da mesma origem", () => {
    expect(isSameOriginRequest(req({ origin: SITE }))).toBe(true);
  });

  it("rejeita POST com Origin cross-site (CSRF)", () => {
    expect(isSameOriginRequest(req({ origin: "https://evil.example" }))).toBe(
      false,
    );
  });

  it("rejeita Origin malformado", () => {
    expect(isSameOriginRequest(req({ origin: "not-a-url" }))).toBe(false);
  });

  it("aceita ausência de Origin quando Sec-Fetch-Site=same-origin", () => {
    expect(isSameOriginRequest(req({ "sec-fetch-site": "same-origin" }))).toBe(
      true,
    );
  });

  it("rejeita ausência de Origin quando Sec-Fetch-Site=cross-site", () => {
    expect(isSameOriginRequest(req({ "sec-fetch-site": "cross-site" }))).toBe(
      false,
    );
  });

  it("aceita entry manual (nenhum header de fetch)", () => {
    expect(isSameOriginRequest(req({ "sec-fetch-site": "none" }))).toBe(true);
  });

  it("rejeita quando não há Origin nem Sec-Fetch-Site confiável", () => {
    expect(isSameOriginRequest(req({}))).toBe(false);
  });
});
