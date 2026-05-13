import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { toFormFieldConfig } from "../entity-form/FormConfig";
import { buildColumnState } from "./entities-table-state.util";

describe("entities-table-state util", () => {
  it("builds columns and inserts action columns", () => {
    const state = buildColumnState({
      entityType: undefined,
      customColumns: [
        { id: "name", label: "Name" },
        { id: "dateOfBirth", hideFromTable: true },
      ],
      columnsToDisplay: undefined,
      selectable: true,
      editable: true,
      actionColumnSelect: "__select",
      actionColumnEdit: "__edit",
      extendFormFieldConfig: (config) => toFormFieldConfig(config),
    });

    expect(state.customColumns.map((column) => column.id)).toEqual([
      "name",
      "dateOfBirth",
    ]);
    expect(state.columnsToDisplay).toEqual(["__select", "__edit", "name"]);
  });

  it("marks non-sortable field types", () => {
    const state = buildColumnState({
      entityType: undefined,
      customColumns: [
        { id: "children", dataType: EntityDatatype.dataType },
        { id: "tags", isArray: true, dataType: "string" },
        { id: "age", viewComponent: "DisplayAge", dataType: "number" },
      ],
      columnsToDisplay: ["children", "tags", "age"],
      selectable: false,
      editable: false,
      actionColumnSelect: "__select",
      actionColumnEdit: "__edit",
      extendFormFieldConfig: (config) => toFormFieldConfig(config),
    });

    expect(
      state.columns.find((column) => column.id === "children")?.noSorting,
    ).toBe(true);
    expect(
      state.columns.find((column) => column.id === "tags")?.noSorting,
    ).toBe(true);
    expect(state.columns.find((column) => column.id === "age")?.noSorting).toBe(
      undefined,
    );
  });
});
