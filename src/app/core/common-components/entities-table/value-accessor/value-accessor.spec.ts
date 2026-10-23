import { configureActiveLocale } from "#src/app/core/language/active-locale";
import { AVAILABLE_LOCALE_IDS } from "#src/app/core/language/available-locales";
import { getReadableValue } from "./value-accessor";

describe("getReadableValue", () => {
  function expectObjectToContain<OBJECT, PROPERTY extends keyof OBJECT>(
    obj: OBJECT,
    expected: (OBJECT[PROPERTY] | "string")[],
    type: string,
  ) {
    let index = 0;
    for (const value of Object.values(obj)) {
      const accessed = getReadableValue(value);
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
      label: "data label",
      value1: 123,
      value2: "hello",
    };
    const accessed = getReadableValue(object);
    expect(typeof accessed).toBe("string");
    expect(accessed).toBe("data label");
  });

  it("should return the object itself if it does not contain a label", () => {
    const object = {
      value1: 123,
      value2: "hello",
    };
    const accessed = getReadableValue(object);
    expect(typeof accessed).toBe("object");
    expect(accessed).toEqual({
      value1: 123,
      value2: "hello",
    });
  });

  it("should return a array of labels if a object is an array of configurable enums", () => {
    const object = [
      { label: "Label1", value: "val1" },
      { label: "Label2", value: "val2" },
    ];
    const readableValue = getReadableValue(object);
    expect(readableValue).toEqual(["Label1", "Label2"]);
  });

  describe("translation maps", () => {
    afterEach(() => {
      configureActiveLocale("en-US", AVAILABLE_LOCALE_IDS);
    });

    it.each([
      ["en-US", "Subject"],
      ["de", "Betreff"],
      ["fr", "Sujet"],
    ])(
      "should return the text of the active language %s",
      (locale, expected) => {
        configureActiveLocale(locale, AVAILABLE_LOCALE_IDS);

        const accessed = getReadableValue({
          "en-US": "Subject",
          de: "Betreff",
          fr: "Sujet",
        });

        expect(accessed).toBe(expected);
      },
    );

    it("should return an object unchanged if it only contains some locale keys", () => {
      const object = { de: "Betreff", other: "Subject" };

      expect(getReadableValue(object)).toBe(object);
    });
  });
});
