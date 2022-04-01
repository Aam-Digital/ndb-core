import { Observable } from "rxjs";
import { first, toArray } from "rxjs/operators";

export interface ObservableMatchers<T> {
  first: jasmine.AsyncMatchers<T, any>;

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
