import { Injectable } from "@angular/core";
import { DatabaseIndexingService } from "../../database-indexing/database-indexing.service";
import { Entity } from "../../model/entity";
import { EntityRegistry } from "../../database-entity.decorator";

/**
 * @deprecated Will be replaced by generic index generation (#262)
 */
@Injectable({
  providedIn: "root",
})
export class HistoricalDataService {
  constructor(
    private dbIndexingService: DatabaseIndexingService,
    private entityRegistry: EntityRegistry,
  ) {
    this.createHistoricalDataIndex();
  }

  private createHistoricalDataIndex(): Promise<void> {
    const designDoc = {
      _id: "_design/historicalData_index",
      views: {
        by_entity: {
          map: `(doc) => {
            if (doc._id.startsWith("HistoricalEntityData")) {
              emit([doc.relatedEntity, new Date(doc.date).getTime()]);
            }
          }`,
        },
      },
    };
    return this.dbIndexingService.createIndex(designDoc);
  }

  getHistoricalDataFor(entityId: string): Promise<Entity[]> {
    return this.dbIndexingService.queryIndexDocs(
      this.entityRegistry.get("HistoricalEntityData"),
      "historicalData_index/by_entity",
      {
        startkey: [entityId, "\uffff"],
        endkey: [entityId],
        descending: true,
      },
    );
  }
}
