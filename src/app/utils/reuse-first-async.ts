/**
 * Wraps a function to ensure only one async operation runs at a time.
 *
 * If called while the first async operation is still pending, returns the same
 * promise. Once the operation completes (success or failure), subsequent calls
 * will start a new operation.
 *
 * @example
 * ```typescript
 * const requestSynced = reuseFirstAsync(request);
 *
 * const promise1 = requestSynced(); // Calls `request`
 * const promise2 = requestSynced(); // Returns promise1
 *
 * const [value1, value2] = await Promise.all([promise1, promise2])
 * assert(value1 === value2)
 *
 * const promise3 = requestSynced(); // Calls `request` again
 * ```
 */
export function reuseFirstAsync<T>(fn: () => Promise<T>): () => Promise<T> {
  let current: Promise<T> | null = null;

  return () => {
    if (current) {
      return current;
    }

    current = fn().finally(() => {
      current = null;
    });

    return current;
  };
}
