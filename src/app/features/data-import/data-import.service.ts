import { Injectable } from "@angular/core";
import { Database } from "../../core/database/database";
import { Papa } from "ngx-papaparse";

@Injectable()
export class DataImportService {

  constructor(private db: Database,
    private papa: Papa) {}

  async importCsv(csv: string): Promise<void> {
    const parsedCsv = this.papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    for (const record of parsedCsv.data) {
      // remove undefined properties
      for (const propertyName in record) {
        if (record[propertyName] === null || propertyName === "_rev") {
          delete record[propertyName];
        }
      }

      await this.db.put(record, true);
    }
  }
}
