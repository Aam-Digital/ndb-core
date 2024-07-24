import { Injectable } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { EntitySchema } from "app/core/entity/schema/entity-schema";

@Injectable({
  providedIn: "root",
})
export class ImportColumnMappingService {
  constructor() {}

  automaticallySelectMappings(
    columnMapping: ColumnMapping[],
    entitySchema: EntitySchema,
  ) {
    const allPropertyNames = Array.from(entitySchema.keys());

    for (const colMap of columnMapping) {
      const lowerCaseColumn = colMap.column.toLowerCase();

      for (const propertyName of allPropertyNames) {
        const propertyLabel = entitySchema
          .get(propertyName)
          ?.label?.toLowerCase();
        if (
          lowerCaseColumn === propertyName.toLowerCase() ||
          (propertyLabel && lowerCaseColumn === propertyLabel)
        ) {
          colMap.propertyName = propertyName;
          break;
        }
      }
    }
  }
}
