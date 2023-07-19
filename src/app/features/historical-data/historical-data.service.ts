import { Injectable } from "@angular/core";
import { HistoricalEntityData } from "./model/historical-entity-data";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";

@Injectable({
  providedIn: "root",
})
export class HistoricalDataService {
  constructor(private dbIndexingService: DatabaseIndexingService) {
    this.createHistoricalDataIndex();
  }

  private createHistoricalDataIndex(): Promise<void> {
    const designDoc = {
      _id: "_design/historicalData_index",
      views: {
        by_entity: {
          map: `(doc) => {
            if (doc._id.startsWith("${HistoricalEntityData.ENTITY_TYPE}")) {
              emit([doc.relatedEntity, new Date(doc.date).getTime()]);
            }
          }`,
        },
      },
    };
    return this.dbIndexingService.createIndex(designDoc);
  }

  getHistoricalDataFor(entityId: string): Promise<HistoricalEntityData[]> {
    return this.dbIndexingService.queryIndexDocs(
      HistoricalEntityData,
      "historicalData_index/by_entity",
      {
        startkey: [entityId, "\uffff"],
        endkey: [entityId],
        descending: true,
      }
    );
  }
}
