import { ObservableQueue } from "./observable-queue";
import { BehaviorSubject, of, Subject } from "rxjs";
import { tap } from "rxjs/operators";

describe("ObservableQueue", () => {
  let queue: ObservableQueue;

  beforeEach(() => {
    queue = new ObservableQueue();
  });

  it("should only start a new job after the previous one is done", () => {
    const job1 = new Subject();
    const job2 = new Subject();
    const job3 = new BehaviorSubject(1);
    let job1Done = false;
    let job2Done = false;
    let job3Done = false;
    queue.add(job1).subscribe(() => (job1Done = true));
    queue.add(job2).subscribe(() => (job2Done = true));
    queue.add(job3).subscribe(() => (job3Done = true));

    expect(job1.observed).toBeTrue();
    expect(job1Done).toBeFalse();
    expect(job2.observed).toBeFalse();
    expect(job2Done).toBeFalse();
    expect(job3.observed).toBeFalse();
    expect(job3Done).toBeFalse();

    job1.next(undefined);
    job1.complete();

    expect(job1Done).toBeTrue();
    expect(job2.observed).toBeTrue();
    expect(job2Done).toBeFalse();
    expect(job3.observed).toBeFalse();
    expect(job3Done).toBeFalse();

    job2.next(undefined);
    job2.complete();

    expect(job1Done).toBeTrue();
    expect(job2Done).toBeTrue();
    // Job 3 is executed once 2 is done
    expect(job3Done).toBeTrue();
  });

  it("should directly run a job if the previous one is already done", () => {
    let job1done = false;
    queue.add(of(1)).subscribe(() => (job1done = true));

    expect(job1done).toBeTrue();

    let job2done = true;
    queue.add(of(1)).subscribe(() => (job2done = true));
    expect(job2done).toBeTrue();
  });

  it("should not run the same observable multiple times", () => {
    let job1Calls = 0;
    const job1 = of(1).pipe(tap(() => job1Calls++));

    queue.add(job1).subscribe();
    expect(job1Calls).toBe(1);

    queue.add(of(2)).subscribe();
    queue.add(of(3)).subscribe();
    expect(job1Calls).toBe(1);
  });

  it("should continue running observables if one throws an error", () => {
    const errorJob = new Subject();
    const normalJob = new Subject();
    let errorJobDone = false;
    let errorJobFailed = false;
    let normalJobDone = false;
    let normalJobFailed = false;

    queue.add(errorJob).subscribe({
      next: () => (errorJobDone = true),
      error: () => (errorJobFailed = true),
    });
    queue.add(normalJob).subscribe({
      next: () => (normalJobDone = true),
      error: () => (normalJobFailed = true),
    });

    expect(errorJob.observed).toBeTrue();
    expect(normalJob.observed).toBeFalse();
    expect(errorJobFailed).toBeFalse();
    expect(errorJobDone).toBeFalse();
    expect(normalJobFailed).toBeFalse();
    expect(normalJobDone).toBeFalse();

    errorJob.error(new Error());

    expect(normalJob.observed).toBeTrue();
    expect(errorJobFailed).toBeTrue();
    expect(errorJobDone).toBeFalse();
    expect(normalJobFailed).toBeFalse();
    expect(normalJobDone).toBeFalse();

    normalJob.next(undefined);
    normalJob.complete();

    expect(errorJobFailed).toBeTrue();
    expect(errorJobDone).toBeFalse();
    expect(normalJobFailed).toBeFalse();
    expect(normalJobDone).toBeTrue();
  });

  it("should return the result of the correct observable", () => {
    const job1 = new Subject();
    const job2 = of("job2");
    let res1;
    let res2;
    queue.add(job1).subscribe((res) => (res1 = res));
    queue.add(job2).subscribe((res) => (res2 = res));

    expect(res1).toBeUndefined();
    expect(res1).toBeUndefined();

    job1.next({ value: "job1 res" });
    job1.complete();

    expect(res1).toEqual({ value: "job1 res" });
    expect(res2).toBe("job2");
  });

  it("should only run next job if previous completes", () => {
    const job1 = new Subject<string>();
    const job2 = new Subject();
    let job1res: string;
    let job1done = false;
    let job2done = false;
    queue.add(job1).subscribe({
      next: (res) => (job1res = res),
      complete: () => (job1done = true),
    });
    queue.add(job2).subscribe({ complete: () => (job2done = true) });

    expect(job1.observed).toBeTrue();
    expect(job2.observed).toBeFalse();
    expect(job1done).toBeFalse();
    expect(job2done).toBeFalse();

    job1.next("some");
    expect(job1res).toBe("some");
    job1.next("values");
    expect(job1res).toBe("values");
    job1.next("emitted");
    expect(job1res).toBe("emitted");

    expect(job1.observed).toBeTrue();
    expect(job2.observed).toBeFalse();
    expect(job1done).toBeFalse();
    expect(job2done).toBeFalse();

    job1.complete();

    expect(job1res).toBe("emitted");
    expect(job2.observed).toBeTrue();
    expect(job1done).toBeTrue();
    expect(job2done).toBeFalse();
  });
});
