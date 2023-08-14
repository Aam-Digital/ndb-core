import { last, Observable, of } from "rxjs";
import { catchError, concatMap, shareReplay } from "rxjs/operators";

export class ObservableQueue {
  private jobQueue: Observable<any> = of(undefined);

  add<T>(obs: Observable<T>): Observable<T> {
    const newJob = this.jobQueue.pipe(
      concatMap(() => obs),
      shareReplay(),
    );
    this.jobQueue = newJob.pipe(
      last(),
      catchError(() => of(undefined)),
    );
    return newJob;
  }
}
