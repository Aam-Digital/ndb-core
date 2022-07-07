import { ConfigurableEnumValue } from "./configurable-enum.interface";
import { EnumOrdering } from "./configurable-enum-ordering";
import { expect } from "@angular/flex-layout/_private-utils/testing";

describe("Configurable Enum Ordering", () => {
  function mockEnumValues(): ConfigurableEnumValue[] {
    return [
      {
        id: "",
        label: "",
      },
      {
        id: "A",
        label: "An a",
      },
      {
        id: "B",
        label: "A b",
      },
    ];
  }

  it("should assign each enum value its corresponding position", () => {
    const enumValues = mockEnumValues();

    const orderedEnumValues = EnumOrdering.imposeTotalOrdering(enumValues);
    expect(orderedEnumValues.map((it) => it._ordinal)).toEqual([0, 1, 2]);
  });

  it("Should be able to compare two ordered enum values", () => {
    const orderedValues = EnumOrdering.imposeTotalOrdering(mockEnumValues());

    expect(EnumOrdering.lt(orderedValues[0], orderedValues[1])).toBeTrue();
    expect(EnumOrdering.lt(orderedValues[0], orderedValues[0])).toBeFalse();
    expect(EnumOrdering.lt(orderedValues[1], orderedValues[0])).toBeFalse();
  });

  it("Should be able to sort an array of ordered enum values", () => {
    const orderedValues = EnumOrdering.imposeTotalOrdering(mockEnumValues());
    const unorderedValues = [
      orderedValues[1],
      orderedValues[2],
      orderedValues[0],
    ];

    expect(EnumOrdering.sort(unorderedValues)).toEqual(orderedValues);
  });
});
