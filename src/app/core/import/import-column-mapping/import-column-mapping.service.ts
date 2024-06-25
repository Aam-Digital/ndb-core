import { Injectable } from "@angular/core";
import { ColumnMapping } from "../column-mapping";

@Injectable({
  providedIn: "root",
})
export class ImportColumnMappingService {
  constructor() {}

  automaticallySelectMappings(columnMapping: ColumnMapping[]) {
    console.log("change mappings now");
    for (const colMap of columnMapping) {
      colMap.propertyName = "name";
    }
  }
}
