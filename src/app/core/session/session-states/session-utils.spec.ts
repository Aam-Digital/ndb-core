import { firstValueFrom, of, toArray } from "rxjs";
import { waitForChangeTo } from "./session-utils";

describe("session-utils", () => {
  it("(waitForChangeTo) Should only emit elements in a stream when the given condition is false", async () => {
    await expect(
      firstValueFrom(
        of("A", "B", "C", "D").pipe(waitForChangeTo("D"), toArray()),
      ),
    ).resolves.toEqual(["D"]);
  });

  it("(waitForChangeTo) should complete when condition is met but further elements are in the pipeline", async () => {
    await expect(
      firstValueFrom(
        of("A", "B", "C", "D").pipe(waitForChangeTo("B"), toArray()),
      ),
    ).resolves.toEqual(["B"]);
  });
});
