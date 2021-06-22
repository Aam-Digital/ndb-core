import { of, Subject } from "rxjs";
import { failOnStates, waitForChangeTo } from "./session-utils";
import { fail } from "assert";
import { take, toArray } from "rxjs/operators";

describe("session-utils", () => {
  it("(waitForChangeTo) Should only emit elements in a stream when the given condition is false", (done) => {
    const stream = of("A", "B", "C", "D");
    stream.pipe(waitForChangeTo("D")).subscribe(
      (next) => {
        expect(next).toBe("D");
      },
      (error) => {
        fail(error);
      },
      () => {
        done();
      }
    );
  });

  it("(waitForChangeTo) should emit all further values in a stream when the given condition is met", (done) => {
    const stream = of("A", "B", "C", "B", "E");
    const expectedResult = ["C", "B", "E"];
    stream.pipe(waitForChangeTo("C"), toArray()).subscribe((next) => {
      expect(next).toEqual(expectedResult);
      done();
    });
  });

  it("(waitForChangeTo) should complete when 'thenComplete' is set to true but further elements are in the pipeline", (done) => {
    const stream = of("A", "B", "C", "D");
    stream.pipe(waitForChangeTo("B", true)).subscribe(
      (next) => {
        expect(next).toBe("B");
      },
      (error) => fail(error),
      () => done()
    );
  });

  it("(failOnStates) should fail with with a custom error", (done) => {
    const stream = of("A", "B", "Err", "C");
    stream.pipe(failOnStates(["Err"])).subscribe(
      () => {},
      (error) => {
        expect(error).toBe("Err");
        done();
      }
    );
  });

  it("(failOnStates) should be able to fail on more than one state ", (done) => {
    const stream1 = of("A", "B", "Err1", "never1");
    const stream2 = of("A", "B", "Err2", "never2");
    const failOnStatesFunction = failOnStates(["Err2", "Err1"]);
    const recorder = new Subject<void>();
    recorder.pipe(take(2)).subscribe(
      () => {},
      () => {},
      () => done()
    );
    stream1.pipe(failOnStatesFunction).subscribe(
      () => {},
      () => recorder.next()
    );
    stream2.pipe(failOnStatesFunction).subscribe(
      () => {},
      () => recorder.next()
    );
  });
});
