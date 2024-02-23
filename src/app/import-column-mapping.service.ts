import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ImportColumnMappingService {
  constructor() {}

  automaticallySelectMappings(columnMapping) {
    console.log("change mappings now");
    for (const colMap of columnMapping) {
      colMap.propertyName = "name";
    }
  }
}
