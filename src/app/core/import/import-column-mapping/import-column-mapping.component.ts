import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityConstructor } from "../../entity/model/entity";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { NgForOf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { EntityFieldSelectComponent } from "../../entity/entity-field-select/entity-field-select.component";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { ImportColumnMappingService } from "./import-column-mapping.service";
import { EditImportColumnMappingComponent } from "../edit-import-column-mapping/edit-import-column-mapping.component";

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
    EditImportColumnMappingComponent,
    HelpButtonComponent,
    NgForOf,
    MatInputModule,
    EntityFieldSelectComponent,
    FormsModule,
    MatButtonModule,
    MatBadgeModule,
  ],
})
export class ImportColumnMappingComponent implements OnChanges {
  @Input() rawData: any[] = [];
  @Input() columnMapping: ColumnMapping[] = [];
  @Output() columnMappingChange = new EventEmitter<ColumnMapping[]>();

  entityCtor: EntityConstructor;

  @Input() set entityType(value: string) {
    if (!value) {
      return;
    }

    this.entityCtor = this.entities.get(value);
    this.dataTypeMap = {};

    [...this.entityCtor.schema.entries()]
      .filter(([_, schema]) => schema.label)
      .map(([name, schema]) => {
        this.dataTypeMap[name] = this.schemaService.getDatatypeOrDefault(
          schema.dataType,
        );
      });
  }

  /** properties that need further adjustments through a component */
  dataTypeMap: { [name: string]: DefaultDatatype };

  constructor(
    private entities: EntityRegistry,
    private schemaService: EntitySchemaService,
    private importColumnMappingService: ImportColumnMappingService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.columnMapping) {
      this.importColumnMappingService.automaticallySelectMappings(
        this.columnMapping,
        this.entityCtor.schema,
      );
    }
  }

  getUsedColNames(currentCol: ColumnMapping): Set<string> {
    const used = new Set<string>();
    for (const col of this.columnMapping) {
      if (col !== currentCol && col.propertyName) {
        used.add(col.propertyName);
      }
    }
    return used;
  }

  updateColumnMapping() {
    this.columnMappingChange.emit([...this.columnMapping]);
  }
}

export interface MappingDialogData {
  col: ColumnMapping;
  values: any[];
  entityType: EntityConstructor;
}
