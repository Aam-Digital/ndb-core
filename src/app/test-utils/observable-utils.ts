import { Observable } from "rxjs";
import { first, toArray } from "rxjs/operators";

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
    return expectAsync(this.observable.pipe(first()).toPromise());
  }

  get inSequence(): jasmine.AsyncMatchers<T[], any> {
    return expectAsync(this.observable.pipe(toArray()).toPromise());
  }
}
