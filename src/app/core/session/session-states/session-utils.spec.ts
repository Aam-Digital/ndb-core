import { of } from "rxjs";
import { waitForChangeTo } from "./session-utils";
import { expectObservable } from "../../../utils/test-utils/observable-utils";

describe("session-utils", () => {
  it("(waitForChangeTo) Should only emit elements in a stream when the given condition is false", () => {
    return expectObservable(
      of("A", "B", "C", "D").pipe(waitForChangeTo("D")),
    ).inSequence.toBeResolvedTo(["D"]);
  });

  it("(waitForChangeTo) should complete when condition is met but further elements are in the pipeline", () => {
    return expectObservable(
      of("A", "B", "C", "D").pipe(waitForChangeTo("B")),
    ).inSequence.toBeResolvedTo(["B"]);
  });
});
