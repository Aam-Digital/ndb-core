import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ParsedData } from "../../data-import/input-file/input-file.component";
import { ColumnMapping } from "../column-mapping";

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
