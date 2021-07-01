import { entityListSortingAccessor } from "./sorting-accessor";

describe("entityListSortingAccessor", () => {
  function expectObjectToContain(obj: object, expected: any[], type: string) {
    let index = 0;
    for (const key of Object.keys(obj)) {
      const accessed = entityListSortingAccessor(obj, key);
      expect(accessed).toEqual(expected[index]);
      expect(typeof accessed).toBe(type);
      index += 1;
    }
  }
  it("should return a string for string-objects", () => {
    const obj = {
      a: "ABC",
      b: "B",
      c: "Hello, World!",
    };
    expectObjectToContain(obj, ["ABC", "B", "Hello, World!"], "string");
  });

  it("should return numbers for number-objects", () => {
    const obj = {
      a: 1,
      b: 2.0,
      c: 10e3,
    };
    expectObjectToContain(obj, [1, 2.0, 10e3], "number");
  });

  it("should return numbers when a string is parsable", () => {
    const obj = {
      a: "1",
      b: "2.0",
      c: "10e3",
      d: "0x1",
    };
    expectObjectToContain(obj, [1, 2.0, 10e3, 0x1], "number");
  });

  it("should return the label when the queried object has a 'label' key", () => {
    const object = {
      data: {
        label: "data label",
        value1: 123,
        value2: "hello",
      },
    };
    const accessed = entityListSortingAccessor(object, "data");
    expect(typeof accessed).toBe("string");
    expect(accessed).toBe("data label");
  });

  it("should return the object itself if it does not contain a label", () => {
    const object = {
      data: {
        value1: 123,
        value2: "hello",
      },
    };
    const accessed = entityListSortingAccessor(object, "data");
    expect(typeof accessed).toBe("object");
    expect(accessed).toEqual({
      value1: 123,
      value2: "hello",
    });
  });
});
