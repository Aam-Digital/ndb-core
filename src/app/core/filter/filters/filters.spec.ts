import { BooleanFilter, Filter, SelectableFilter } from "./filters";
import { FilterService } from "../filter.service";

describe("Filters", () => {
  const filterService = new FilterService(undefined);

  function testFilter(
    filterObj: Filter<any>,
    testData: any[],
    expectedFilteredResult: any[],
  ) {
    const filterPred = filterService.getFilterPredicate(filterObj.getFilter());
    const filtered = testData.filter(filterPred);
    expect(filtered).toEqual(expectedFilteredResult);
    return filtered;
  }

  it("create an instance", () => {
    const fs = new SelectableFilter(
      "",
      [{ key: "", label: "", filter: "" }],
      "",
    );
    expect(fs).toBeTruthy();
  });

  it("init new options", () => {
    const fs = new SelectableFilter(
      "",
      [{ key: "", label: "", filter: "" }],
      "",
    );

    const keys = ["x", "y"];
    fs.options = SelectableFilter.generateOptions(keys, "category");

    expect(fs.options).toHaveSize(keys.length + 1);

    fs.selectedOption = "x";

    const testData = [
      { id: 1, category: "x" },
      { id: 2, category: "y" },
    ];
    const filteredData = testFilter(fs, testData, [testData[0]]);
    expect(filteredData[0].category).toBe("x");
  });

  it("should support a boolean filter", async () => {
    const filter = new BooleanFilter("Boolean Filter", "My Filter", {
      id: "value",
      type: "boolean",
      default: "true",
      true: "is true",
      false: "is not true",
      all: "All",
    });

    const recordTrue = { value: true };
    const recordFalse = { value: false };
    const recordUndefined = {};

    filter.selectedOption = "true";
    testFilter(
      filter,
      [recordFalse, recordTrue, recordUndefined],
      [recordTrue],
    );

    filter.selectedOption = "false";
    testFilter(
      filter,
      [recordFalse, recordTrue, recordUndefined],
      [recordFalse, recordUndefined],
    );

    filter.selectedOption = "all";
    testFilter(
      filter,
      [recordFalse, recordTrue, recordUndefined],
      [recordFalse, recordTrue, recordUndefined],
    );
  });
});
