import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { toFormFieldConfig } from "../entity-form/FormConfig";
import { buildColumnState } from "./entities-table-state.util";
import { inferDefaultSort } from "./entities-table-sort.store";

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

    const sort = inferDefaultSort(
      state.columnsToDisplay,
      state.columns,
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
