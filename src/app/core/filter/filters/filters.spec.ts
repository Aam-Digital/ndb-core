import {
  combineFilterConditions,
  Filter,
  resolveCurrentRecordPlaceholders,
  SelectableFilter,
} from "./filters";
import { FilterService } from "../filter.service";
import { BooleanFilter } from "./booleanFilter";
import { StringFilter } from "./stringFilter";
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

    expect(filter.options).toHaveLength(keys.length);

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

  it("should create a $regex query for a string filter", () => {
    const filter = new StringFilter("name", "Name");

    filter.selectedOptionValues = ["john"];
    expect(filter.getFilter()).toEqual({
      name: { $regex: "john", $options: "i" },
    });
  });

  it("should match no filter (all records) when string filter is empty", () => {
    const filter = new StringFilter("name", "Name");

    filter.selectedOptionValues = [];
    expect(filter.getFilter()).toBeUndefined();

    filter.selectedOptionValues = [""];
    expect(filter.getFilter()).toBeUndefined();

    filter.selectedOptionValues = ["   "];
    expect(filter.getFilter()).toBeUndefined();
  });

  it("should filter records containing the text (case-insensitive) with a string filter", () => {
    const filter = new StringFilter("name", "Name");

    const johnny = { name: "Johnny Doe" };
    const jane = { name: "Jane Smith" };
    const noName = { name: undefined };

    filter.selectedOptionValues = ["john"];
    testFilter(filter, [johnny, jane, noName], [johnny]);

    filter.selectedOptionValues = ["AN"];
    testFilter(filter, [johnny, jane, noName], [jane]);

    filter.selectedOptionValues = [];
    testFilter(filter, [johnny, jane, noName], [johnny, jane, noName]);
  });

  it("should match regex special characters literally in a string filter", () => {
    const filter = new StringFilter("name", "Name");

    const withBracket = { name: "Doe (Senior)" };
    const withoutBracket = { name: "Doe Senior" };

    filter.selectedOptionValues = ["(Senior)"];
    testFilter(filter, [withBracket, withoutBracket], [withBracket]);
  });

  it("should support numbers as options", () => {
    const filter = new SelectableFilter("counts", [], "Counts");

    const keys = [1, 4, 7];
    filter.options = SelectableFilter.generateOptions(keys, "category");

    expect(filter.options).toHaveLength(keys.length);

    filter.selectedOptionValues = ["1"];

    const testData = [
      { id: 1, category: 1 },
      { id: 2, category: 4 },
    ];
    const filteredData = testFilter(filter, testData, [testData[0]]);
    expect(filteredData[0].category).toBe(1);
  });

  it("should combine conditions without producing empty branches", () => {
    const a = { name: "x" };
    const b = { $or: [{ category: 1 }, { category: 2 }] };

    expect(combineFilterConditions(), "no condition").toEqual({});
    expect(combineFilterConditions({}, {}), "only empty conditions").toEqual(
      {},
    );
    expect(combineFilterConditions(a, {}), "one relevant condition").toEqual(a);
    expect(combineFilterConditions(a, b), "two relevant conditions").toEqual({
      $and: [a, b],
    });
    expect(
      combineFilterConditions(a, {}, b),
      "empty condition in between",
    ).toEqual({ $and: [a, b] });
  });

  describe("resolveCurrentRecordPlaceholders", () => {
    const record: Record<string, unknown> = {
      location: "BERLIN",
      locations: ["BERLIN", "HAMBURG"],
      name: "Anna",
    };
    const getValue = (fieldId: string) => record[fieldId];

    it.each([
      [
        "keeps a condition without placeholders",
        { level: { $in: ["COUNTRY"] } },
        { level: { $in: ["COUNTRY"] } },
      ],
      [
        "replaces a placeholder in an $in list",
        { primaryLocation: { $in: ["$current_record.location"] } },
        { primaryLocation: { $in: ["BERLIN"] } },
      ],
      [
        "spreads the values of a multi-value field into the list",
        { primaryLocation: { $in: ["OTHER", "$current_record.locations"] } },
        { primaryLocation: { $in: ["OTHER", "BERLIN", "HAMBURG"] } },
      ],
      [
        "replaces a plain placeholder value",
        { name: "$current_record.name" },
        { name: "Anna" },
      ],
      [
        "replaces placeholders nested in $or, $elemMatch and negations",
        {
          $or: [
            { tags: { $elemMatch: { $in: ["$current_record.location"] } } },
            { region: { $not: { $in: ["$current_record.location"] } } },
          ],
        },
        {
          $or: [
            { tags: { $elemMatch: { $in: ["BERLIN"] } } },
            { region: { $not: { $in: ["BERLIN"] } } },
          ],
        },
      ],
    ])("%s", (_, condition, expected) => {
      const original = structuredClone(condition);

      expect(resolveCurrentRecordPlaceholders(condition, getValue)).toEqual(
        expected,
      );
      // the condition usually is shared config, so it must not be changed in place
      expect(condition).toEqual(original);
    });

    it.each([[undefined], [null], [""], [[]]])(
      "leaves out the row referencing an empty field (%j)",
      (emptyValue) => {
        const condition = {
          level: { $in: ["COUNTRY"] },
          primaryLocation: { $in: ["$current_record.location"] },
        };

        expect(
          resolveCurrentRecordPlaceholders(condition, () => emptyValue),
        ).toEqual({ level: { $in: ["COUNTRY"] } });
      },
    );

    it.each([
      [
        "a row among the alternatives",
        {
          $or: [{ level: "COUNTRY" }, { location: "$current_record.location" }],
        },
        { $or: [{ level: "COUNTRY" }] },
      ],
      [
        "only the unresolved part of an alternative",
        {
          $or: [
            { level: "COUNTRY", location: "$current_record.location" },
            { name: "A" },
          ],
        },
        { $or: [{ level: "COUNTRY" }, { name: "A" }] },
      ],
      [
        "all alternatives, together with the list of alternatives",
        {
          level: "COUNTRY",
          $or: [{ location: "$current_record.location" }],
        },
        { level: "COUNTRY" },
      ],
      [
        "a placeholder nested anywhere in a row's value",
        {
          level: "COUNTRY",
          location: { $not: { $in: ["OTHER", "$current_record.location"] } },
        },
        { level: "COUNTRY" },
      ],
      [
        "every row (nothing is left to apply)",
        { location: "$current_record.location" },
        {},
      ],
    ])("leaves out %s", (_, condition, expected) => {
      expect(
        resolveCurrentRecordPlaceholders(condition, () => undefined),
      ).toEqual(expected);
    });
  });
});
