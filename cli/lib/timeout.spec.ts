import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PausableTimeout, withTimeout } from "./timeout";

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

    await expect(withTimeout(failing, 50, "timed out")).rejects.toThrow("boom");
  });
});

describe("PausableTimeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  it("does not count the time spent in a paused operation", async () => {
    const timeout = new PausableTimeout(50, "timed out");
    const result = timeout.run(
      (async () => {
        await sleep(20);
        await timeout.pause(() => sleep(1000));
        await sleep(20);
        return "done";
      })(),
    );

    await vi.advanceTimersByTimeAsync(1040);

    await expect(result).resolves.toBe("done");
  });

  it("rejects once the unpaused time before and after a pause runs out", async () => {
    const timeout = new PausableTimeout(50, "timed out");
    const result = timeout.run(
      (async () => {
        await sleep(30);
        await timeout.pause(() => sleep(1000));
        await sleep(30);
        return "done";
      })(),
    );
    const assertion = expect(result).rejects.toThrow("timed out");

    await vi.advanceTimersByTimeAsync(1060);

    await assertion;
  });

  it("propagates the original rejection", async () => {
    const timeout = new PausableTimeout(50, "timed out");

    await expect(
      timeout.run(Promise.reject(new Error("boom"))),
    ).rejects.toThrow("boom");
  });
});
