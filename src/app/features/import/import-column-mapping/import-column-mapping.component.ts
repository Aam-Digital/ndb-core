import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
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
export class ImportColumnMappingComponent implements OnChanges {
  @Input() rawData: any[] = [];
  @Input() columnMapping: ColumnMapping[];
  @Output() columnMappingChange = new EventEmitter<ColumnMapping[]>();

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("entityType")) {
      this.resetMappingToEntityType();
    }
  }

  /**
   * un-map properties not matching the entityType
   * @private
   */
  private resetMappingToEntityType() {
    this.columnMapping
      .filter((c) => !this.allProps.includes(c.propertyName))
      .forEach((c) => (c.propertyName = undefined));
    this.updateMapping();
  }

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

  /**
   * Emit an updated columnMapping array and emit change event, to ensure smooth change detection.
   */
  updateMapping() {
    this.columnMappingChange.emit([...this.columnMapping]);
  }

  // TODO: infer column mapping from data. The following is from old DataImportModule
  /**
   * Try to guess mappings of import file columns to entity properties.
   * (e.g. based on column headers)
   * @private
   */
  private inferColumnPropertyMapping() {
    //const columnMap: ImportColumnMap = {};
    //    for (const p of this.properties) {
    //      const match = this.importData?.fields.find(
    //        (f) => f === p.label || f === p.key
    //      );
    //      if (match) {
    //        columnMap[match] = p;
    //      }
    //    }
    //
    //    this.loadColumnMapping(columnMap);
  }
}

export interface MappingDialogData {
  col: ColumnMapping;
  values: any[];
  entityType: EntityConstructor;
}
