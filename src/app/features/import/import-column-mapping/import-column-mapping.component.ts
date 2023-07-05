import { Component, Input } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { ComponentType } from "@angular/cdk/overlay";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { DataImportService } from "../../data-import/data-import.service";
import { EnumValueMappingComponent } from "./enum-value-mapping/enum-value-mapping.component";
import { DateValueMappingComponent } from "./date-value-mapping/date-value-mapping.component";
import { MatDialog } from "@angular/material/dialog";

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
  @Input() rawData: any[] = [];
  @Input() columnMapping: ColumnMapping[];

  @Input()
  set entityType(value: string) {
    this._entityType = this.entities.get(value);
    this.mappingCmp = {};
    this.allProps = [...this._entityType.schema.entries()]
      .filter(([_, schema]) => schema.label)
      .map(([name, schema]) => {
        // TODO can we move this to a better place?
        if (
          schema.dataType === "boolean" ||
          schema.dataType === "configurable-enum" ||
          schema.innerDataType === "configurable-enum"
        ) {
          this.mappingCmp[name] = EnumValueMappingComponent;
        }
        if (this.importService.dateDataTypes.includes(schema.dataType)) {
          this.mappingCmp[name] = DateValueMappingComponent;
        }
        return name;
      });
  }

  private _entityType: EntityConstructor;
  // entity properties that have a label
  allProps: string[] = [];
  // properties that need further adjustments through a component
  mappingCmp: { [key: string]: ComponentType<any> };

  labelMapper = (name: string) => this._entityType.schema.get(name).label;
  isUsed = (option: string) =>
    this.columnMapping.some(({ propertyName }) => propertyName === option);

  constructor(
    private entities: EntityRegistry,
    private importService: DataImportService,
    private dialog: MatDialog
  ) {}

  openMappingComponent(col: ColumnMapping) {
    const uniqueValues = new Set();
    this.rawData.forEach((obj) => uniqueValues.add(obj[col.column]));
    this.dialog.open<any, MappingDialogData>(
      this.mappingCmp[col.propertyName],
      {
        data: {
          col: col,
          values: [...uniqueValues],
          entityType: this._entityType,
        },
        disableClose: true,
      }
    );
  }
}

export interface MappingDialogData {
  col: ColumnMapping;
  values: any[];
  entityType: EntityConstructor;
}
