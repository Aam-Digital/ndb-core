import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ParsedData } from "../../data-import/input-file/input-file.component";
import { ColumnMapping } from "../column-mapping";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { ComponentType } from "@angular/cdk/overlay";

/**
 * Import sub-step: Let user map columns from import data to entity properties
 * and define value matching and transformations.
 */
@Component({
  selector: "app-import-column-mapping",
  templateUrl: "./import-column-mapping.component.html",
  styleUrls: ["./import-column-mapping.component.scss"],
})
export class ImportColumnMappingComponent {
  @Input() entityType: string;

  @Output() columnMappingChange = new EventEmitter<ColumnMapping[]>();
  @Input() columnMapping: ColumnMapping[];

  @Input() rawData: ParsedData<any>;
}

type PropertyConfig = {
  /** schema of the mapped entity property */
  schema: EntitySchemaField;

  /** popup component to allow user to manually map or configure the data transformation */
  mappingCmp?: ComponentType<any>;

  /** data transformation of values to be imported */
  mappingFn?: (val: any, cal: ColumnMapping) => any;

  /** all unique values appearing in import data */
  uniqueValues: string[];
};
