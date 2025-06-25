import { Filter, SelectableFilter } from "./filters";
import { FilterService } from "../filter.service";
import { BooleanFilter } from "./booleanFilter";
import { Entity } from "../../entity/model/entity";
import { TestBed } from "@angular/core/testing";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";

describe("Filters", () => {
  let filterService: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ConfigurableEnumService, useValue: null }],
    });

    filterService = TestBed.inject(FilterService);
  });

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
