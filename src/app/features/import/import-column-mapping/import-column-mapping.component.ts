import { Component, Input } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { ComponentType } from "@angular/cdk/overlay";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { ImportService } from "../import.service";

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

  @Input() set entityType(value: string) {
    this.entityCtr = this.entities.get(value);
    this.mappingCmp = {};
    this.allProps = [...this.entityCtr.schema.entries()]
      .filter(([_, schema]) => schema.label)
      .map(([name, schema]) => {
        const cmp = this.importService.getMappingComponent(schema);
        if (cmp) {
          this.mappingCmp[name] = cmp;
        }
        return name;
      });
  }

  private entityCtr: EntityConstructor;
  // entity properties that have a label
  allProps: string[] = [];
  // properties that need further adjustments through a component
  mappingCmp: { [key: string]: ComponentType<any> };

  labelMapper = (name: string) => this.entityCtr.schema.get(name).label;
  isUsed = (option: string) =>
    this.columnMapping.some(({ propertyName }) => propertyName === option);

  constructor(
    private entities: EntityRegistry,
    private importService: ImportService,
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
          entityType: this.entityCtr,
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
