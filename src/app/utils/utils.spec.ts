import { calculateAge, groupBy, isValidDate, sortByAttribute } from "./utils";
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
      sortByAttribute("number", "asc"),
    );

    expect(sorted).toEqual([first, second, third, forth]);

    const sortedDesc = [forth, first, third, second].sort(
      sortByAttribute("number", "desc"),
    );

    expect(sortedDesc).toEqual([forth, third, second, first]);
  });

  it("should sort undefined last", () => {
    const first = { number: 1 };
    const second = { number: 10 };
    const third = { number: undefined };

    const sorted = [second, third, first].sort(
      sortByAttribute("number", "asc"),
    );

    expect(sorted).toEqual([first, second, third]);

    const sortedDesc = [second, third, first].sort(
      sortByAttribute("number", "desc"),
    );

    expect(sortedDesc).toEqual([third, second, first]);
  });

  it("should create groups with the same ID, not just object equality", () => {
    const first = { a: { id: "a", label: "A" } };
    const second = { a: { id: "a", label: "A" } };
    const third = { a: { id: "b", label: "B" } };
    // we don't have object equality
    expect(first.a).not.toBe(second.a);

    const groups = groupBy([first, second, third], "a");

    expect(groups).toEqual([
      [{ id: "a", label: "A" }, [first, second]],
      [{ id: "b", label: "B" }, [third]],
    ]);
  });
});
