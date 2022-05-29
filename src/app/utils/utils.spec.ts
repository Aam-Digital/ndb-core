import {
  calculateAge,
  getEarlierDateOrToday,
  isValidDate,
  sortByAttribute,
} from "./utils";
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
    let dob = moment().subtract(9, "years");
    let age = calculateAge(dob.toDate());
    expect(age).toBe(9);
    dob = dob.add("1", "day");
    age = calculateAge(dob.toDate());
    expect(age).toBe(8);
  });

  it("should sort an array by the passed attribute", () => {
    const first = { number: 1 };
    const second = { number: 10 };
    const third = { number: 10 };
    const forth = { number: 11 };

    const sorted = [second, first, third, forth].sort(
      sortByAttribute("number", "asc")
    );

    expect(sorted).toEqual([first, second, third, forth]);

    const sortedDesc = [forth, first, third, second].sort(
      sortByAttribute("number", "desc")
    );

    expect(sortedDesc).toEqual([forth, third, second, first]);
  });

  it("should sort undefined last", () => {
    const first = { number: 1 };
    const second = { number: 10 };
    const third = { number: undefined };

    const sorted = [second, third, first].sort(
      sortByAttribute("number", "asc")
    );

    expect(sorted).toEqual([first, second, third]);

    const sortedDesc = [second, third, first].sort(
      sortByAttribute("number", "desc")
    );

    expect(sortedDesc).toEqual([third, second, first]);
  });

  describe("getEarlierDateOrToday", () => {
    it("should getEarlierDateOrToday", () => {
      const TODAY = new Date();

      const earlierDate = new Date(2019, 0, 1);
      expect(getEarlierDateOrToday(earlierDate)).toEqual(earlierDate);

      const laterDate = new Date();
      laterDate.setMonth(laterDate.getMonth() + 1);
      let actualDate = getEarlierDateOrToday(laterDate);
      expect(actualDate.getFullYear()).toEqual(TODAY.getFullYear());
      expect(actualDate.getMonth()).toEqual(TODAY.getMonth());
      expect(actualDate.getDate()).toEqual(TODAY.getDate());

      const noDate = undefined;
      actualDate = getEarlierDateOrToday(noDate);
      expect(actualDate.getFullYear()).toEqual(TODAY.getFullYear());
      expect(actualDate.getMonth()).toEqual(TODAY.getMonth());
      expect(actualDate.getDate()).toEqual(TODAY.getDate());
    });
  });
});
