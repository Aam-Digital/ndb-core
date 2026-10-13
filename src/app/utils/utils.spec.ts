import {
  calculateAge,
  groupBy,
  isValidDate,
  mapInBatches,
  sortByAttribute,
} from "./utils";
import moment from "moment";

describe("Utils", () => {
  async function runMapInBatchesTracked() {
    let running = 0;
    let maxRunning = 0;
    const result = await mapInBatches(
      [1, 2, 3, 4, 5, 6, 7],
      3,
      async (n, index) => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((resolve) => setTimeout(resolve));
        running--;
        return `${index}:${n * 2}`;
      },
    );
    return { result, maxRunning };
  }

  it("mapInBatches should keep the order of the input", async () => {
    const { result } = await runMapInBatchesTracked();

    expect(result).toEqual([
      "0:2",
      "1:4",
      "2:6",
      "3:8",
      "4:10",
      "5:12",
      "6:14",
    ]);
  });

  it("mapInBatches should run at most batchSize items in parallel", async () => {
    const { maxRunning } = await runMapInBatchesTracked();

    expect(maxRunning).toBe(3);
  });

  it("mapInBatches should stop starting new batches after a failure", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("fail"));

    await expect(mapInBatches([1, 2, 3, 4], 2, fn)).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("isValidDate for normal Date object", () => {
    const testDate = new Date();
    expect(isValidDate(testDate)).toBe(true);
  });

  it("not isValidDate for some other object", () => {
    const testDate = {};
    expect(isValidDate(testDate)).toBe(false);
  });

  it("not isValidDate for Date object with invalid value", () => {
    const testDate = new Date("foo");
    expect(isValidDate(testDate)).toBe(false);
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

  it("should group by individual elements within the property, if group by property is an array", () => {
    const first = { categories: ["a"] };
    const second = { categories: ["a", "b"] };
    const third = { categories: [] };

    const groups = groupBy([first, second, third], "categories");

    expect(groups).toEqual([
      ["a", [first, second]],
      ["b", [second]],
      [undefined, [third]],
    ]);
  });
});
