/** Rejects with `message` if `promise` hasn't settled within `ms`. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Like {@link withTimeout}, but the clock can be paused,
 * e.g. while waiting for the user to answer a question.
 */
export class PausableTimeout {
  private remaining: number;
  private startedAt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private expire: (() => void) | undefined;

  constructor(
    ms: number,
    private readonly message: string,
  ) {
    this.remaining = ms;
  }

  /** Rejects with the message if `promise` hasn't settled within the unpaused time. */
  run<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.expire = () => reject(new Error(this.message));
      this.start();
      promise.then(resolve, reject).finally(() => {
        this.stop();
        this.expire = undefined;
      });
    });
  }

  /** Stop the clock while `operation` runs. */
  async pause<T>(operation: () => Promise<T>): Promise<T> {
    this.stop();
    try {
      return await operation();
    } finally {
      this.start();
    }
  }

  private start(): void {
    if (!this.expire || this.timer !== undefined) return;
    this.startedAt = Date.now();
    this.timer = setTimeout(this.expire, Math.max(this.remaining, 0));
  }

  private stop(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remaining -= Date.now() - this.startedAt;
  }
}
