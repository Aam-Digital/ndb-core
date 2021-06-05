import { collator } from "./sorting";

describe("Sorting", () => {
  it("Sorts string values according to their numeric value", () => {
    const actualStringOrder = ["1", "10", "2", "3", "X"];
    const expectedStringOrder = ["1", "2", "3", "10", "X"];
    actualStringOrder.sort((s1, s2) => collator.compare(s1, s2));
    expect(actualStringOrder).toEqual(expectedStringOrder);
  });
});
