import { ConfigurableEnumValue } from "./configurable-enum.interface";
import { Ordering } from "./configurable-enum-ordering";

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

    const orderedEnumValues = Ordering.imposeTotalOrdering(enumValues);
    expect(orderedEnumValues.map((it) => it._ordinal)).toEqual([0, 1, 2]);
  });

  it("correctly identifier an objects with _ordinal values", () => {
    [
      {
        _ordinal: 0,
      },
      {
        _ordinal: "A",
      },
      {
        _ordinal: 1,
        otherField: 2,
      },
    ].forEach((obj) => {
      expect(Ordering.hasOrdinalValue(obj)).toBeTrue();
    });
  });

  it("identifies entities without '_ordinal' value", () => {
    [
      0,
      "ordinal",
      {
        notOrdinal: 0,
      },
    ].forEach((thing) => {
      expect(Ordering.hasOrdinalValue(thing)).toBeFalse();
    });
  });
});
