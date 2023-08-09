import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { HelpButtonComponent } from "../../../core/common-components/help-button/help-button.component";
import { NgForOf, NgIf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { BasicAutocompleteComponent } from "../../../core/configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { ImportValueMapping } from "./import-value-mapping";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { getInnermostDatatype } from "../../../core/entity-components/entity-utils/entity-utils";

/**
 * Import sub-step: Let user map columns from import data to entity properties
 * and define value matching and transformations.
 */
@Component({
  selector: "app-import-column-mapping",
  templateUrl: "./import-column-mapping.component.html",
  styleUrls: ["./import-column-mapping.component.scss"],
  standalone: true,
  imports: [
    HelpButtonComponent,
    NgForOf,
    MatInputModule,
    BasicAutocompleteComponent,
    FormsModule,
    MatButtonModule,
    NgIf,
    MatBadgeModule,
  ],
})
export class ImportColumnMappingComponent {
  @Input() rawData: any[] = [];
  @Input() columnMapping: ColumnMapping[] = [];
  @Output() columnMappingChange = new EventEmitter<ColumnMapping[]>();

  @Input() set entityType(value: string) {
    if (!value) {
      return;
    }

    this.entityCtor = this.entities.get(value);
    this.valueMapper = {};
    this.allProps = [...this.entityCtor.schema.entries()]
      .filter(([_, schema]) => schema.label)
      .map(([name, schema]) => {
        this.valueMapper[name] = this.schemaService.getDatatypeOrDefault(
          getInnermostDatatype(schema),
        );
        return name;
      });
  }

  private entityCtor: EntityConstructor;

  /** entity properties that have a label */
  allProps: string[] = [];

  /** properties that need further adjustments through a component */
  valueMapper: { [key: string]: ImportValueMapping };

  /** warning label badges for a mapped column that requires user configuration for the "additional" details */
  mappingAdditionalWarning: { [key: string]: string } = {};

  labelMapper = (name: string) => this.entityCtor.schema.get(name).label;
  isUsed = (option: string) =>
    this.columnMapping.some(({ propertyName }) => propertyName === option);

  constructor(
    private entities: EntityRegistry,
    private schemaService: EntitySchemaService,
    private dialog: MatDialog,
  ) {}

  openMappingComponent(col: ColumnMapping) {
    const uniqueValues = new Set<any>();
    this.rawData.forEach((obj) => uniqueValues.add(obj[col.column]));
    this.dialog
      .open<any, MappingDialogData>(
        this.valueMapper[col.propertyName].importConfigComponent,
        {
          data: {
            col: col,
            values: [...uniqueValues],
            entityType: this.entityCtor,
          },
          disableClose: true,
        },
      )
      .afterClosed()
      .subscribe(() => this.updateMapping(col, true));
  }

  updateMapping(col: ColumnMapping, settingAdditional: boolean = false) {
    if (!settingAdditional) {
      // reset additional, because mapping changed
      delete col.additional;
    }

    this.mappingAdditionalWarning[col.column] =
      this.valueMapper[col.propertyName]?.importIncompleteAdditionalConfigBadge(
        col,
      );

    // Emitting copy of array to trigger change detection; values have been updated in place through data binding
    this.columnMappingChange.emit([...this.columnMapping]);
  }

  // TODO: infer column mapping from data. The following is from old DataImportModule (#1942)
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
