import { firstValueFrom, Observable } from "rxjs";
import { toArray } from "rxjs/operators";

export interface ObservableMatchers<T> {
  /**
   * only check for the first value if an observable
   * and discard the rest
   */
  first: jasmine.AsyncMatchers<T, any>;

  /**
   * check for all observables in the sequence that they
   * arrived
   */
  inSequence: jasmine.AsyncMatchers<T[], any>;
}

export function expectObservable<T>(
  observable: Observable<T>
): ObservableMatchers<T> {
  return new ObservableMatchersImpl(observable);
}

class ObservableMatchersImpl<T> implements ObservableMatchers<T> {
  constructor(private observable: Observable<T>) {}

  get first(): jasmine.AsyncMatchers<T, any> {
    return expectAsync(firstValueFrom(this.observable));
  }

  get inSequence(): jasmine.AsyncMatchers<T[], any> {
    return expectAsync(firstValueFrom(this.observable.pipe(toArray())));
  }
}
