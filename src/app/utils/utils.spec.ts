import { isValidDate } from "./utils";

describe("Utils", () => {
  it("isValidDate for normal Date object", () => {
    const testDate = new Date();
    expect(isValidDate(testDate)).toBeTrue();
  });

  it("not isValidDate for some other object", () => {
    const testDate = {};
    expect(isValidDate(testDate)).toBeFalse();
  });

  it("not isValidDate for Date object with invalid value", () => {
    const testDate = new Date("foo");
    expect(isValidDate(testDate)).toBeFalse();
  });
});
