import { Component, OnInit } from "@angular/core";
import { ColumnDescription } from "../column-description";
import { FormFieldConfig } from "../../entity-details/form/FormConfig";
import { ColumnDescriptionInputType } from "../column-description-input-type.enum";

@Component({
  selector: "app-configurable-entity-subrecord",
  template: `<app-entity-subrecord
    [records]="records"
    [columns]="entitySubrecordConfig"
  ></app-entity-subrecord>`,
  styleUrls: ["./configurable-entity-subrecord.component.scss"],
})
export class ConfigurableEntitySubrecordComponent implements OnInit {
  config: { cols: FormFieldConfig[] };
  entitySubrecordConfig: ColumnDescription[] = [];
  records: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.entitySubrecordConfig = this.config.cols.map((col) =>
      this.transformToEntitySubrecordFormat(col)
    );
  }

  private transformToEntitySubrecordFormat(
    column: FormFieldConfig
  ): ColumnDescription {
    const resultColumn: ColumnDescription = {
      name: column.id,
      label: column.placeholder,
      inputType: null,
      tooltip: column.additionalInfo,
    };
    switch (column.input) {
      case "text":
        resultColumn.inputType = ColumnDescriptionInputType.TEXT;
        break;
      case "configurable-enum-select":
        resultColumn.inputType = ColumnDescriptionInputType.ENUM;
        resultColumn.valueFunction = (entity) => entity[column.id].label;
        resultColumn.enumId = column.enumId;
        break;
      case "date":
        resultColumn.inputType = ColumnDescriptionInputType.DATE;
    }
    return resultColumn;
  }
}
