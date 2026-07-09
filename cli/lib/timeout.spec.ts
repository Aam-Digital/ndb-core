import { describe, expect, it } from "vitest";

import { withTimeout } from "./timeout";

describe("withTimeout", () => {
  it("resolves with the underlying value when it settles in time", async () => {
    const result = await withTimeout(Promise.resolve("done"), 50, "timed out");

    expect(result).toBe("done");
  });

  it("rejects with the timeout message when the promise hangs", async () => {
    const hang = new Promise(() => {
      // never settles
    });

    await expect(withTimeout(hang, 10, "timed out")).rejects.toThrow(
      "timed out",
    );
  });

  it("propagates the original rejection when it settles before the timeout", async () => {
    const failing = Promise.reject(new Error("boom"));

    await expect(withTimeout(failing, 50, "timed out")).rejects.toThrow(
      "boom",
    );
  });
});
