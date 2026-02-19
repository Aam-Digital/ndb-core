import { Injectable, inject } from "@angular/core";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { Entity } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { ConfigService } from "../../config/config.service";
import { Logging } from "../../logging/logging.service";
import { EMPTY, from } from "rxjs";
import { catchError, concatMap, startWith } from "rxjs/operators";

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
    this.configService.configUpdates
      .pipe(
        startWith(null),
        concatMap(() =>
          from(this.createSearchIndex()).pipe(
            catchError((error) => {
              Logging.error("Failed to create search index", error);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe();
  }

  /**
   * Creates the search index based on the `toStringAttributes` and the `searchable` schema property
   * @private
   */
  private async createSearchIndex(): Promise<void> {
    this.initializeSearchableEntities();

    const designDoc = {
      _id: "_design/search_index",
      views: {
        by_name: {
          map: this.getSearchIndexDesignDoc(),
        },
      },
    };

    await this.indexingService.createIndex(designDoc);
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
    searchIndex += `const splitTokens = (value) => value.toLowerCase().split(/[\\s/.:,]+/).filter((val) => !!val)\n`;
    this.searchableEntities.forEach(([type, attributes]) => {
      searchIndex += `if (doc._id.startsWith("${type}:")) {\n`;
      attributes.forEach((attr) => {
        searchIndex += `if (doc["${attr}"] !== undefined && doc["${attr}"] !== null) {\n`;
        searchIndex += `splitTokens(doc["${attr}"].toString()).forEach((val) => emit(val))\n`;
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
      .flatMap((attr) => this.tokenizeSearchTerm(doc[attr]))
      .join(" ")
      .toLowerCase();
    return searchTerms.every((s) => values.includes(s));
  }

  /**
   * Converts a search value into lowercase tokens used for indexing and matching.
   * Supports primitive values and arrays; splits tokens by whitespace, "/", ":", ".", and ",".
   */
  private tokenizeSearchTerm(value: unknown): string[] {
    if (value === null || value === undefined) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.flatMap((entry) => this.tokenizeSearchTerm(entry));
    }
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean" &&
      typeof value !== "bigint"
    ) {
      return [];
    }
    return value
      .toString()
      .toLowerCase()
      .split(/[\s/.:,]+/)
      .filter((token) => token.length > 0);
  }

  private transformDocToEntity(doc): Entity {
    const ctor = this.entities.get(Entity.extractTypeFromId(doc._id));
    const entity = new ctor(doc._id);
    this.schemaService.loadDataIntoEntity(entity, doc);
    return entity;
  }
}
