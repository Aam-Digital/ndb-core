import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { Entity } from "../../../core/entity/model/entity";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";

@Component({
  selector: "app-import-review-data",
  templateUrl: "./import-review-data.component.html",
  styleUrls: ["./import-review-data.component.scss"],
})
export class ImportReviewDataComponent {
  @Input() rawData: any[];
  @Input() entityType: string;
  @Input() columnMapping: ColumnMapping[];

  @Output() importComplete = new EventEmitter<void>();

  mappedEntities: Entity[] = [];
  displayColumns: string[] = [];

  constructor(
    private entityTypes: EntityRegistry,
    private schemaService: EntitySchemaService
  ) {}

  // TODO: popup confirmation: <app-import-confirm-summary></app-import-confirm-summary>
  columns: any;

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

    this.columns = this.columnMapping
      .filter(({ propertyName }) => !!propertyName)
      .map(({ propertyName }) => propertyName);
  }

  private parseRow(val: any, mapping: ColumnMapping, entity: Entity) {
    if (!mapping.propertyName) {
      return undefined;
    }

    /*
    if (mapping.property.mappingFn) {
      return mapping.property.mappingFn(val, mapping);
    } else {
      return this.schemaService
        .getDatatypeOrDefault(mapping.property.schema.dataType)
        .transformToObjectFormat(
          val,
          mapping.property.schema,
          this.schemaService,
          entity
        );
    }
    */
  }
}
