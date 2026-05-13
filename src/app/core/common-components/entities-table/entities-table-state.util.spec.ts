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
});
