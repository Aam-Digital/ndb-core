import { Injectable } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { EntityConstructor } from "app/core/entity/model/entity";
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
    console.log("property names", allPropertyNames);

    console.log("change mappings now");
    for (const colMap of columnMapping) {
      if (allPropertyNames.includes(colMap.column)) {
        colMap.propertyName = colMap.column;
      }
    }
  }
}
