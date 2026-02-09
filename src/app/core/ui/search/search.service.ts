import { Injectable, inject } from "@angular/core";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { Entity } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { ConfigService } from "../../config/config.service";

/**
 * This service handles to logic for global searches across all entities
 */
@Injectable({
  providedIn: "root",
})
export class SearchService {
  private indexingService = inject(DatabaseIndexingService);
  private schemaService = inject(EntitySchemaService);
  private entities = inject(EntityRegistry);
  private readonly configService = inject(ConfigService);

  private searchableEntities: [string, string[]][];

  constructor() {
    this.configService.configUpdates.subscribe(() => this.createSearchIndex());
    this.createSearchIndex();
  }

  /**
   * Creates the search index based on the `toStringAttributes` and the `searchable` schema property
   * @private
   */
  private createSearchIndex() {
    this.initializeSearchableEntities();

    const designDoc = {
      _id: "_design/search_index",
      views: {
        by_name: {
          map: this.getSearchIndexDesignDoc(),
        },
      },
    };

    this.indexingService.createIndex(designDoc);
  }

  private initializeSearchableEntities() {
    this.searchableEntities = [...this.entities.entries()]
      .map(([name, ctr]) => {
        const stringAttributes = ctr.toStringAttributes.filter((attr) =>
          ctr.schema.has(attr),
        );
        const searchableAttributes = [...ctr.schema.entries()]
          .filter(([_, schema]) => schema.searchable)
          .map(([name]) => name);
        return [name, [...stringAttributes, ...searchableAttributes]] as [
          string,
          string[],
        ];
      })
      .filter(([_, props]) => props.length > 0);
  }

  private getSearchIndexDesignDoc() {
    let searchIndex = `(doc) => {\n`;
    searchIndex += `const tokenize = (value) => value.toString().toLowerCase().split(/[^a-z0-9]+/).filter((val) => !!val)\n`;
    this.searchableEntities.forEach(([type, attributes]) => {
      searchIndex += `if (doc._id.startsWith("${type}:")) {\n`;
      attributes.forEach((attr) => {
        searchIndex += `if (doc["${attr}"] !== undefined && doc["${attr}"] !== null) {\n`;
        searchIndex += `tokenize(doc["${attr}"]).forEach((val) => emit(val))\n`;
        searchIndex += `}\n`;
      });
      searchIndex += `return\n`;
      searchIndex += `}\n`;
    });
    searchIndex += `}`;
    return searchIndex;
  }

  /**
   * Returns the results matching the provided search term.
   * Multiple search terms should be separated by a space
   * @param searchTerm for which entities should be returned
   */
  async getSearchResults(searchTerm: string): Promise<Entity[]> {
    const searchTerms = this.tokenizeSearchTerm(searchTerm);
    if (searchTerms.length === 0) {
      return [];
    }
    const res = await this.indexingService.queryIndexRaw(
      "search_index/by_name",
      {
        startkey: searchTerms[0],
        endkey: searchTerms[0] + "\ufff0",
        include_docs: true,
      },
    );
    return this.getUniqueDocs(res.rows)
      .filter((doc) => this.containsSecondarySearchTerms(doc, searchTerms))
      .map((doc) => this.transformDocToEntity(doc));
  }

  private getUniqueDocs(rows: any[]): any[] {
    const uniques = new Map<string, any>();
    rows.forEach((row) => uniques.set(row.doc._id, row.doc));
    return [...uniques.values()];
  }

  private containsSecondarySearchTerms(doc, searchTerms: string[]): boolean {
    const entityType = Entity.extractTypeFromId(doc._id);
    const values = this.searchableEntities
      .find(([type]) => type === entityType)[1]
      .map((attr) => this.tokenizeSearchTerm(doc[attr]).join(" "))
      .join(" ")
      .toLowerCase();
    return searchTerms.every((s) => values.includes(s));
  }

  /**
   * Normalize a search input into lowercase alphanumeric tokens.
   * Splits on any non-alphanumeric separator (e.g. spaces, dots, slashes).
   */
  private tokenizeSearchTerm(searchTerm: unknown): string[] {
    if (searchTerm === null || searchTerm === undefined) {
      return [];
    }

    return searchTerm
      .toString()
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 0);
  }

  private transformDocToEntity(doc): Entity {
    const ctor = this.entities.get(Entity.extractTypeFromId(doc._id));
    const entity = new ctor(doc._id);
    this.schemaService.loadDataIntoEntity(entity, doc);
    return entity;
  }
}
