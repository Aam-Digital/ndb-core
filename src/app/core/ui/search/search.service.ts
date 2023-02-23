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
    const searchableEntities = [...this.entities.entries()]
      .map(
        ([name, ctr]) =>
          [
            name,
            ctr.toStringAttributes
              .filter((attr) => ctr.schema.has(attr))
              .concat(
                [...ctr.schema.entries()]
                  .filter(([_, schema]) => schema.searchable)
                  .map(([name]) => name)
              ),
          ] as [string, string[]]
      )
      .filter(([_, props]) => props.length > 0);

    let searchIndex = `(doc) => {\n`;
    searchableEntities.forEach(([type, attributes]) => {
      searchIndex += `if (doc._id.startsWith("${type}:")) {\n`;
      attributes.forEach((attr) => {
        searchIndex += `if (doc["${attr}"]) {\n`;
        searchIndex += `emit(doc["${attr}"].toString().toLowerCase())\n`;
        searchIndex += `}\n`;
      });
      searchIndex += `return\n`;
      searchIndex += `}\n`;
    });
    searchIndex += `}`;
    console.log("index", searchIndex);

    const designDoc = {
      _id: "_design/search_index",
      views: {
        by_name: {
          map: searchIndex,
        },
      },
    };

    this.searchReady = from(this.indexingService.createIndex(designDoc));
  }

  getSearchResults(searchTerm: string): Promise<Entity[]> {
    searchTerm = searchTerm.toLowerCase();
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
