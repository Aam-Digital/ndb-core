import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { toFormFieldConfig } from "../entity-form/FormConfig";
import { buildColumnState } from "./entities-table-state.util";
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
    const state = buildColumnState({
      entityType: TestEntity,
      customColumns: [
        { id: "children", dataType: EntityDatatype.dataType },
        { id: "name", dataType: "string" },
      ],
      columnsToDisplay: ["children", "name"],
      selectable: false,
      editable: false,
      actionColumnSelect: "__select",
      actionColumnEdit: "__edit",
      extendFormFieldConfig: (config) => toFormFieldConfig(config),
    });

    const columns = applySortingRules(
      state.columns,
      () => new DefaultDatatype(),
    );
    const sort = inferDefaultSort(
      state.columnsToDisplay,
      columns,
      () => undefined,
    );
    expect(sort).toEqual({ active: "name", direction: "asc" });
  });

  it("uses descending default sort for date columns", () => {
    const state = buildColumnState({
      entityType: undefined,
      customColumns: [{ id: "created", dataType: "date" }],
      columnsToDisplay: ["created"],
      selectable: false,
      editable: false,
      actionColumnSelect: "__select",
      actionColumnEdit: "__edit",
      extendFormFieldConfig: (config) => toFormFieldConfig(config),
    });

    const sort = inferDefaultSort(
      state.columnsToDisplay,
      state.columns,
      (dataType) => (dataType === "date" ? new DateDatatype() : undefined),
    );
    expect(sort).toEqual({ active: "created", direction: "desc" });
  });
});
