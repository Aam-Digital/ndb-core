import { Filter, SelectableFilter } from "./filters";
import { FilterService } from "../filter.service";
import { BooleanFilter } from "./booleanFilter";
import { NumberFilter } from "./numberFilter";
import { Entity } from "../../entity/model/entity";

describe("Filters", () => {
  const filterService = new FilterService(undefined);

  function testFilter(
    filterObj: Filter<Entity>,
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
    const filter = new SelectableFilter(
      "name",
      [{ key: "option-1", label: "op", filter: {} }],
      "name",
    );

    const keys: string[] = ["x", "y"];
    filter.options = SelectableFilter.generateOptions(keys, "category");

    expect(filter.options).toHaveSize(keys.length);

    filter.selectedOptionValues = ["x"];

    const testData = [
      { id: 1, category: "x" },
      { id: 2, category: "y" },
    ];
    const filteredData = testFilter(filter, testData, [testData[0]]);
    expect(filteredData[0].category).toBe("x");
  });

  it("should support a boolean filter", async () => {
    const filter = new BooleanFilter("Boolean Filter", "My Filter", {
      id: "value",
      type: "boolean",
      default: "true",
      true: "is true",
      false: "is not true",
    });

    const recordTrue = { value: true };
    const recordFalse = { value: false };

    filter.selectedOptionValues = ["true"];
    testFilter(filter, [recordFalse, recordTrue], [recordTrue]);

    filter.selectedOptionValues = ["false"];
    testFilter(filter, [recordFalse, recordTrue], [recordFalse]);

    filter.selectedOptionValues = [];
    testFilter(filter, [recordFalse, recordTrue], [recordFalse, recordTrue]);

    filter.selectedOptionValues = ["true", "false"];
    testFilter(filter, [recordFalse, recordTrue], [recordFalse, recordTrue]);
  });

  fit("should support a numbers filter", async () => {
    const filter = new NumberFilter("value", "My Filter");

    const record_5 = { value: -5 };
    const record0 = { value: 0 };
    const record1 = { value: 1 };
    const record2 = { value: 2 };
    const record3 = { value: 3 };
    const record10 = { value: 10 };
    const records = [record_5, record0, record1, record2, record3, record10];

    filter.selectedOptionValues = ["2", "3"];
    testFilter(filter, records, [record2, record3]);

    filter.selectedOptionValues = ["-8", "1"];
    testFilter(filter, records, [record_5, record0, record1]);

    filter.selectedOptionValues = ["10", "10"];
    testFilter(filter, records, [record10]);

    filter.selectedOptionValues = ["10", ""];
    testFilter(filter, records, [record10]);

    filter.selectedOptionValues = ["", "-1"];
    testFilter(filter, records, [record_5]);

    filter.selectedOptionValues = ["", ""];
    testFilter(filter, records, records);
  });

  it("should support numbers as options", () => {
    const filter = new SelectableFilter("counts", [], "Counts");

    const keys = [1, 4, 7];
    filter.options = SelectableFilter.generateOptions(keys, "category");

    expect(filter.options).toHaveSize(keys.length);

    filter.selectedOptionValues = ["1"];

    const testData = [
      { id: 1, category: 1 },
      { id: 2, category: 4 },
    ];
    const filteredData = testFilter(filter, testData, [testData[0]]);
    expect(filteredData[0].category).toBe(1);
  });
});
