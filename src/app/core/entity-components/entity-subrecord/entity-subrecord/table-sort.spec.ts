import { tableSort } from "./table-sort";
import moment from "moment";
import { ConfigurableEnumConfig } from "../../../configurable-enum/configurable-enum.interface";

describe("TableSort", () => {
  it("should sort strings with partial numbers correctly", () => {
    testSort(["PN1", "PN2", "PN12"]);
  });

  it("should sort dates correctly", () => {
    testSort([
      moment().subtract(1, "week").toDate(),
      moment().subtract(3, "days").toDate(),
      new Date(),
    ]);
  });

  it("should sort numbers correctly", () => {
    testSort([1, 1.4, 3, Infinity]);
  });

  it("should sort a array with null and undefined values correctly", () => {
    testSort(["1", 2, "three", undefined]);
  });

  it("should sort configurable enums based on their label", () => {
    const values: ConfigurableEnumConfig = [
      { id: "first", label: "aAa" },
      { id: "second", label: "Bbb" },
      { id: "third", label: "CDE" },
    ];
    testSort(values);
  });

  it("should allow to filter descending", () => {
    testSort([null, 3, 2.5, 2, "1"], "desc");
  });

  it("should return input array if not sort direction is defined", () => {
    const values = ["3", 1, 2, undefined, "ten"].map((val) => ({
      record: { key: val },
    }));
    const result = tableSort([...values], { direction: "", active: "key" });
    expect(result).toEqual(values);
  });

  it("should return input array if no active property is defined", () => {
    const values = [2, 1, 3].map((val) => ({ record: { key: val } }));
    const result = tableSort([...values], { direction: "asc", active: "" });
    expect(result).toEqual(values);
  });

  function testSort(
    sortedArray: any[],
    direction: "asc" | "desc" | "" = "asc"
  ) {
    const objectArray = sortedArray.map((val) => ({ record: { key: val } }));
    for (let i = 0; i < sortedArray.length; i++) {
      const shuffled = shuffle(objectArray);
      const result = tableSort(shuffled, { direction, active: "key" });
      const resultValues = result.map((row) => row.record.key);
      console.log("result", resultValues, sortedArray);
      expect(resultValues).toEqual(sortedArray);
    }
  }

  function shuffle<OBJECT>(array: OBJECT[]): OBJECT[] {
    let currentIndex = array.length;
    const result = [...array];
    let randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [result[currentIndex], result[randomIndex]] = [
        result[randomIndex],
        result[currentIndex],
      ];
    }

    return result;
  }
});
