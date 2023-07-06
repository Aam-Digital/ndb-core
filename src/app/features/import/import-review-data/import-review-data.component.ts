import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { Entity } from "../../../core/entity/model/entity";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { ImportService } from "../import.service";

@Component({
  selector: "app-import-review-data",
  templateUrl: "./import-review-data.component.html",
  styleUrls: ["./import-review-data.component.scss"],
})
export class ImportReviewDataComponent implements OnChanges {
  @Input() rawData: any[];
  @Input() entityType: string;
  @Input() columnMapping: ColumnMapping[];

  @Output() importComplete = new EventEmitter<void>();

  mappedEntities: Entity[] = [];
  displayColumns: string[] = [];

  constructor(
    private entityTypes: EntityRegistry,
    private schemaService: EntitySchemaService,
    private importService: ImportService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    // Every change requires a complete re-calculation
    this.transformRawDataToEntities();
  }

  // TODO: popup confirmation: <app-import-confirm-summary></app-import-confirm-summary>

  private transformRawDataToEntities() {
    // TODO: this may be better of in a service?

    const entityConstructor = this.entityTypes.get(this.entityType);

    this.mappedEntities = this.rawData.map((row) => {
      const e = new entityConstructor();
      Object.entries(row).forEach(([col, val]) => {
        const mapping: ColumnMapping = this.columnMapping.find(
          ({ column }) => column === col
        );

        const parsed = this.parseRow(val, mapping, e);

        if (parsed) {
          e[mapping.propertyName] = parsed;
        }
      });
      return e;
    });

    this.displayColumns = this.columnMapping
      .filter(({ propertyName }) => !!propertyName)
      .map(({ propertyName }) => propertyName);
  }

  private parseRow(val: any, mapping: ColumnMapping, entity: Entity) {
    if (!mapping.propertyName) {
      return undefined;
    }

    const schema = entity.getSchema().get(mapping.propertyName);
    const mappingFn = this.importService.getMappingFunction(schema);
    if (mappingFn) {
      return mappingFn(val, mapping.additional);
    } else {
      return this.schemaService
        .getDatatypeOrDefault(schema.dataType)
        .transformToObjectFormat(val, schema, this.schemaService, entity);
    }
  }
}
