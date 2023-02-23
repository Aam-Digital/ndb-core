import { Injectable } from "@angular/core";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { from, Observable } from "rxjs";
import { Entity } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

@Injectable({
  providedIn: "root",
})
export class SearchService {
  searchReady: Observable<any>;

  constructor(
    private indexingService: DatabaseIndexingService,
    private schemaService: EntitySchemaService,
    private entities: EntityRegistry
  ) {
    this.createSearchIndex();
  }

  private createSearchIndex() {
    // `emit(x)` to add x as a key to the index that can be searched
    const searchMapFunction = `
      (doc) => {
        if (doc.hasOwnProperty("searchIndices")) {
           doc.searchIndices.forEach(word => emit(word.toString().toLowerCase()));
        }
      }`;

    const designDoc = {
      _id: "_design/search_index",
      views: {
        by_name: {
          map: searchMapFunction,
        },
      },
    };

    this.searchReady = from(this.indexingService.createIndex(designDoc));
  }

  getSearchResults(searchTerm: string): Promise<Entity[]> {
    return this.indexingService
      .queryIndexRaw("search_index/by_name", {
        startkey: searchTerm,
        endkey: searchTerm + "\ufff0",
        include_docs: true,
      })
      .then((res) => res.rows.map((doc) => this.transformDocToEntity(doc)));
  }

  private transformDocToEntity(doc: {
    key: string;
    id: string;
    doc: object;
  }): Entity {
    const ctor = this.entities.get(Entity.extractTypeFromId(doc.id));
    const entity = doc.id ? new ctor(doc.id) : new ctor();
    if (doc.doc) {
      this.schemaService.loadDataIntoEntity(entity, doc.doc);
    }
    return entity;
  }
}
