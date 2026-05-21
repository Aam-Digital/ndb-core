import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { toFormFieldConfig } from "../entity-form/FormConfig";
import {
  applySortingRules,
  inferDefaultSort,
} from "./entities-table-sort.store";

describe("applySortingRules", () => {
  it("marks non-sortable field types", () => {
    const columns = applySortingRules(
      [
        toFormFieldConfig({
          id: "children",
          dataType: EntityDatatype.dataType,
        }),
        toFormFieldConfig({ id: "tags", isArray: true, dataType: "string" }),
        toFormFieldConfig({
          id: "age",
          viewComponent: "DisplayAge",
          dataType: "number",
        }),
      ],
      () => new DefaultDatatype(),
    );

    expect(columns.find((c) => c.id === "children")?.noSorting).toBe(true);
    expect(columns.find((c) => c.id === "tags")?.noSorting).toBe(true);
    expect(columns.find((c) => c.id === "age")?.noSorting).toBe(undefined);
  });
});

describe("inferDefaultSort", () => {
  it("infers default sort from first sortable column", () => {
    const columns = applySortingRules(
      [
        toFormFieldConfig({
          id: "children",
          dataType: EntityDatatype.dataType,
        }),
        toFormFieldConfig({ id: "name", dataType: "string" }),
      ],
      () => new DefaultDatatype(),
    );
    const sort = inferDefaultSort(
      ["children", "name"],
      columns,
      () => undefined,
    );
    expect(sort).toEqual({ active: "name", direction: "asc" });
  });

  it("uses descending default sort for date columns", () => {
    const columns = [toFormFieldConfig({ id: "created", dataType: "date" })];
    const sort = inferDefaultSort(["created"], columns, (dataType) =>
      dataType === "date" ? new DateDatatype() : undefined,
    );
    expect(sort).toEqual({ active: "created", direction: "desc" });
  });
});
