import { of } from "rxjs";
import { waitForChangeTo } from "./session-utils";
import { fail } from "assert";

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

  it("(waitForChangeTo) should complete when condition is met but further elements are in the pipeline", (done) => {
    const stream = of("A", "B", "C", "D");
    stream.pipe(waitForChangeTo("B")).subscribe(
      (next) => {
        expect(next).toBe("B");
      },
      (error) => fail(error),
      () => done()
    );
  });
});
