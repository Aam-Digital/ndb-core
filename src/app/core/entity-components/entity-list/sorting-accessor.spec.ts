import { entityListSortingAccessor } from "./sorting-accessor";

describe("default sorting accessor", () => {
  it("should return a string for string-objects", () => {
    const obj = {
      a: "ABC",
      b: "B",
      c: "Hello, World"!,
    };
    // tslint:disable-next-line:forin
    for (const element in obj) {
      const accessed = entityListSortingAccessor(obj, element);
      expect(typeof accessed).toBe("string");
    }
  });

  it("should return numbers for a number-objects", () => {
    const obj = {
      a: 1,
      b: 2.0,
      c: 10e3,
    };
    // tslint:disable-next-line:forin
    for (const element in obj) {
      const accessed = entityListSortingAccessor(obj, element);
      expect(typeof accessed).toBe("number");
    }
  });

  it("should return the label when the queried object's name is 'label'", () => {
    const object = {
      data: {
        label: "data label",
        value1: 123,
        value2: "hello",
      },
    };
    const accessed = entityListSortingAccessor(object, "data");
    expect(accessed).toBe("data label");
  });

  it("should return the object itself it it does not contain a label", () => {
    const object = {
      data: {
        value1: 123,
        value2: "hello",
      },
    };
    const accessed = entityListSortingAccessor(object, "data");
    expect(accessed).toEqual({
      value1: 123,
      value2: "hello",
    });
  });
});
