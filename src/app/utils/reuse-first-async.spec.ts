import { reuseFirstAsync } from "./reuse-first-async";

describe("reuseFirstAsync", () => {
  it("returns the same promise when called multiple times while pending", async () => {
    let resolvePromise: (value: number) => void;
    const request = jasmine.createSpy().and.returnValue(
      new Promise<number>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const requestSynced = reuseFirstAsync(request);

    const promise1 = requestSynced();
    const promise2 = requestSynced();
    const promise3 = requestSynced();
    expect(promise1).toBe(promise2);
    expect(promise2).toBe(promise3);
    expect(request).toHaveBeenCalledTimes(1);

    resolvePromise(1);
    expect(await promise1).toBe(1);
  });

  it("should start a new operation after the previous one completes", async () => {
    let resolvePromise: (value: number) => void;
    const request = jasmine.createSpy().and.returnValue(
      new Promise<number>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const requestSynced = reuseFirstAsync(request);

    const promise1 = requestSynced();
    expect(request).toHaveBeenCalledTimes(1);

    resolvePromise(1);
    await promise1;
    const promise4 = requestSynced();
    const promise5 = requestSynced();
    expect(promise4).toBe(promise5);
    expect(request).toHaveBeenCalledTimes(2);

    resolvePromise(2);
    expect(await promise4).toBe(1);
  });

  it("should start a new operation after the previous one rejects", async () => {
    const mockFn = jasmine
      .createSpy()
      .and.returnValues(
        Promise.reject(new Error("first error")),
        Promise.resolve("success"),
      );

    const requestSynced = reuseFirstAsync(mockFn);

    const error = await requestSynced().catch((error) => error);
    expect(error).toBeInstanceOf(Error);
    expect((error as any).message).toBe("first error");

    const result = await requestSynced();
    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
