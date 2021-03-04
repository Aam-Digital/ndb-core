import { calculateAge, isValidDate } from "./utils";
import moment from "moment";

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

  it("should calculate age correctly", () => {
    const dob = moment().subtract(9, "years");
    const age = calculateAge(dob.toDate());
    expect(age).toBe(9);
  });
});
