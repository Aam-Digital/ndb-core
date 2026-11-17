/**
 * A promise that a test settles itself, to control exactly when a mocked async step finishes.
 */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // an unhandled rejection would otherwise fail the test even once the
  // rejection is later handled by whichever code actually awaits `promise`
  promise.catch(() => {});
  return { promise, resolve, reject };
}
