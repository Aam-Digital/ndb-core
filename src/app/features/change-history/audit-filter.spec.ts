import { Entity } from "../../core/entity/model/entity";
import {
  AUDIT_BASE_FILTER,
  authorFilterOptions,
  entityTypeFilterOptions,
  operationFilterOptions,
} from "./audit-filter";

/** the built selector, which is an untyped Mango object at the database edge */
function optionFilter(option: { filter: unknown }): Record<string, any> {
  return option.filter as Record<string, any>;
}

describe("AUDIT_BASE_FILTER", () => {
  it("should exclude baselines, which are snapshots rather than changes", () => {
    expect(AUDIT_BASE_FILTER).toEqual({
      timestamp: { $gt: null },
      operation: { $ne: "baseline" },
    });
  });
});

describe("entityTypeFilterOptions", () => {
  it("should match a record type as a prefix range on the stored id", () => {
    const [option] = entityTypeFilterOptions([
      { key: "Child", label: "Child" },
    ]);

    expect(option.key).toBe("Child");
    expect(optionFilter(option).entityId).toEqual({
      $gte: "Child:",
      $lt: "Child:￰",
    });
  });
});

describe("operationFilterOptions", () => {
  it("should offer every filterable operation, labelled as the badge labels it", () => {
    const options = operationFilterOptions();

    expect(options.map((option) => option.key)).toEqual([
      "create",
      "update",
      "delete",
    ]);
    expect(options.map((option) => option.label)).toEqual([
      "Created",
      "Updated",
      "Deleted",
    ]);
  });

  it("should narrow to the one operation", () => {
    const [create] = operationFilterOptions();

    expect(optionFilter(create).operation).toBe("create");
  });
});

describe("authorFilterOptions", () => {
  it("should match the author however the backend recorded them", () => {
    // the backend writes what the token carried: the record's id where the
    // account names one, and the plain username otherwise
    const [option] = authorFilterOptions([new Entity("demo")]);

    expect(optionFilter(option).$or).toEqual([
      { "user.name": "Entity:demo" },
      { "user.id": "Entity:demo" },
      { "user.name": "demo" },
    ]);
  });

  it("should offer the record's name rather than its id", () => {
    const author = new Entity("demo");
    vi.spyOn(author, "toString").mockReturnValue("Demo Admin");

    const [option] = authorFilterOptions([author]);

    expect(option.label).toBe("Demo Admin");
    expect(option.key).toBe("Entity:demo");
  });
});
