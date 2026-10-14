import { describe, expect, it } from "vitest";
import { getAuthCallbackUrl, getAuthPageHref, getAuthReturnPath } from "./auth-redirect";

const origin = "https://forms.example.test";

describe("authentication redirect helpers", () => {
  it("keeps the local next path in email verification callback URLs", () => {
    expect(getAuthCallbackUrl("/form/form-id-title?source=invite", origin))
      .toBe(`${origin}/form/form-id-title?source=invite`);
  });

  it("preserves next on login and sign-up cross-links", () => {
    expect(getAuthPageHref("/login", "/form/form-id-title?source=invite"))
      .toBe("/login?next=%2Fform%2Fform-id-title%3Fsource%3Dinvite");
    expect(getAuthPageHref("/sign-up", "/form/form-id-title"))
      .toBe("/sign-up?next=%2Fform%2Fform-id-title");
  });

  it("rejects external next paths", () => {
    expect(getAuthReturnPath("//evil.example.test/path", origin)).toBe("/dashboard");
    expect(getAuthReturnPath("https://evil.example.test", origin)).toBe("/dashboard");
  });

  it("handles concurrent redirect calculations independently", async () => {
    const paths = await Promise.all([
      Promise.resolve().then(() => getAuthReturnPath("/form/one", origin)),
      Promise.resolve().then(() => getAuthReturnPath("/form/two", origin)),
    ]);

    expect(paths).toEqual(["/form/one", "/form/two"]);
  });
});
