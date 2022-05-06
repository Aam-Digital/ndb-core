import { getReadableValue } from "./value-accessor";

describe("getReadableValue", () => {
  function expectObjectToContain<OBJECT, PROPERTY extends keyof OBJECT>(
    obj: OBJECT,
    expected: (OBJECT[PROPERTY] | "string")[],
    type: string
  ) {
    let index = 0;
    for (const key of Object.keys(obj) as PROPERTY[]) {
      const accessed = getReadableValue(obj, key);
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

  it("should return the label when the queried object has a 'label' key", () => {
    const object = {
      data: {
        label: "data label",
        value1: 123,
        value2: "hello",
      },
    };
    const accessed = getReadableValue(object, "data");
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
    const accessed = getReadableValue(object, "data");
    expect(typeof accessed).toBe("object");
    expect(accessed).toEqual({
      value1: 123,
      value2: "hello",
    });
  });

  it("should return a array of labels if a object has an array of configurable enums", () => {
    const object = {
      arr: [
        { label: "Label1", value: "val1" },
        { label: "Label2", value: "val2" },
      ],
    };
    const readableValue = getReadableValue(object, "arr");
    expect(readableValue).toEqual(["Label1", "Label2"]);
  });
});
