import { FlattenArrayPipe } from "./flatten-array.pipe";

describe("FlattenArrayPipe", () => {
  let pipe: FlattenArrayPipe;

  beforeEach(() => {
    pipe = new FlattenArrayPipe();
  });

  it("should remove undefined from array", () => {
    expect(pipe.transform([1, undefined, 2])).toEqual([1, 2]);
  });

  it("should flatten deep array", () => {
    expect(
      pipe.transform([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([1, 2, 3, 4]);
  });

  it("should handle mix of deep and undefined items", () => {
    expect(pipe.transform([undefined, [3, undefined, 4]])).toEqual([3, 4]);
  });
});
