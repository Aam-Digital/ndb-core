import { firstValueFrom, Observable } from "rxjs";
import { toArray } from "rxjs/operators";
import { expect } from "vitest";

export interface AsyncMatchers<T> {
  toBeResolvedTo(expected: T): Promise<void>;
  toBeRejectedWith(expected: unknown): Promise<void>;
  toBeRejectedWithError(error?: string | RegExp | Error): Promise<void>;
}

export interface ObservableMatchers<T> {
  /**
   * only check for the first value if an observable
   * and discard the rest
   */
  first: AsyncMatchers<T>;

  /**
   * check for all observables in the sequence that they
   * arrived
   */
  inSequence: AsyncMatchers<T[]>;
}

export function expectObservable<T>(
  observable: Observable<T>,
): ObservableMatchers<T> {
  return new ObservableMatchersImpl(observable);
}

class PromiseAsyncMatchers<T> implements AsyncMatchers<T> {
  constructor(private readonly promise: Promise<T>) {}

  toBeResolvedTo(expected: T): Promise<void> {
    return expect(this.promise).resolves.toEqual(expected);
  }

  toBeRejectedWith(expected: unknown): Promise<void> {
    return expect(this.promise).rejects.toEqual(expected);
  }

  toBeRejectedWithError(error?: string | RegExp | Error): Promise<void> {
    return expect(this.promise).rejects.toThrowError(error);
  }
}

class ObservableMatchersImpl<T> implements ObservableMatchers<T> {
  constructor(private readonly observable: Observable<T>) {}

  get first(): AsyncMatchers<T> {
    return new PromiseAsyncMatchers(firstValueFrom(this.observable));
  }

  get inSequence(): AsyncMatchers<T[]> {
    return new PromiseAsyncMatchers(
      firstValueFrom(this.observable.pipe(toArray())),
    );
  }
}
