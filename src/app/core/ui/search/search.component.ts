import { Component } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { Observable } from "rxjs";
import { concatMap, debounceTime, skipUntil, tap } from "rxjs/operators";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { Router } from "@angular/router";
import { fromPromise } from "rxjs/internal-compatibility";
import { FormControl } from "@angular/forms";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";

/**
 * General search box that provides results out of any kind of entities from the system
 * as soon as the user starts typing.
 *
 * This is usually displayed in the app header to be available to the user anywhere, allowing to navigate quickly.
 */
@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
})
export class SearchComponent {
  MIN_CHARACTERS_FOR_SEARCH: number = 3;
  INPUT_DEBOUNCE_TIME_MS: number = 400;

  readonly NOTHING_ENTERED = 0;
  readonly TOO_FEW_CHARACTERS = 1;
  readonly SEARCH_IN_PROGRESS = 2;
  readonly NO_RESULTS = 3;
  readonly SHOW_RESULTS = 4;
  readonly ILLEGAL_INPUT = 5;

  state = this.NOTHING_ENTERED;

  formControl = new FormControl();

  results: Observable<Entity[]>;

  constructor(
    private indexingService: DatabaseIndexingService,
    private router: Router,
    private entitySchemaService: EntitySchemaService,
    private entities: EntityRegistry
  ) {
    this.results = this.formControl.valueChanges.pipe(
      debounceTime(this.INPUT_DEBOUNCE_TIME_MS),
      skipUntil(this.createSearchIndex()),
      tap((next) => (this.state = this.updateState(next))),
      concatMap((next: string) => this.searchResults(next))
    );
  }

  private updateState(next: any): number {
    if (typeof next !== "string") {
      return this.ILLEGAL_INPUT;
    }
    if (next.length === 0) {
      return this.NOTHING_ENTERED;
    }
    if (!this.isRelevantSearchInput(next)) {
      return this.ILLEGAL_INPUT;
    }
    return next.length < this.MIN_CHARACTERS_FOR_SEARCH
      ? this.TOO_FEW_CHARACTERS
      : this.SEARCH_IN_PROGRESS;
  }

  async searchResults(next: string): Promise<Entity[]> {
    if (this.state !== this.SEARCH_IN_PROGRESS) {
      return [];
    }
    const searchTerms = next.toLowerCase().split(" ");
    const entities = await this.indexingService.queryIndexRaw(
      "search_index/by_name",
      {
        startkey: searchTerms[0],
        endkey: searchTerms[0] + "\ufff0",
        include_docs: true,
      }
    );
    const filtered = this.prepareResults(entities.rows, searchTerms);
    const uniques = this.uniquify(filtered);
    this.state = uniques.length === 0 ? this.NO_RESULTS : this.SHOW_RESULTS;
    return uniques;
  }

  async clickOption(optionElement) {
    // TODO this requires to routes to be called similar to the entities, can we ensure this?
    const resultEntity: Entity = optionElement.value;
    await this.router.navigate([
      resultEntity.getType().toLowerCase(),
      resultEntity.getId(),
    ]);

    this.formControl.setValue("");
  }

  /**
   * Check if the input should start an actual search.
   * Only search for words starting with a char or number -> no searching for space or no input
   * @param searchText
   */
  private isRelevantSearchInput(searchText: string): boolean {
    return /^[a-zA-Z]+|\d+$/.test(searchText);
  }

  private createSearchIndex(): Observable<void> {
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

    return fromPromise(this.indexingService.createIndex(designDoc));
  }

  private prepareResults(
    rows: [{ key: string; id: string; doc: object }],
    searchTerms: string[]
  ): Entity[] {
    return rows
      .map((doc) => this.transformDocToEntity(doc))
      .filter((entity) =>
        this.containsSecondarySearchTerms(entity, searchTerms)
      );
  }

  private containsSecondarySearchTerms(
    entity: Entity,
    searchTerms: string[]
  ): boolean {
    const searchIndices = entity.searchIndices.join(" ").toLowerCase();
    return searchTerms.every((s) => searchIndices.includes(s));
  }

  private uniquify(entities: Entity[]): Entity[] {
    const uniques = new Map<string, Entity>();
    entities.forEach((e) => {
      uniques.set(e.getId(), e);
    });
    return [...uniques.values()];
  }

  private transformDocToEntity(doc: {
    key: string;
    id: string;
    doc: object;
  }): Entity {
    const ctor = this.entities.get(Entity.extractTypeFromId(doc.id));
    const entity = doc.id ? new ctor(doc.id) : new ctor();
    if (doc.doc) {
      this.entitySchemaService.loadDataIntoEntity(entity, doc.doc);
    }
    return entity;
  }
}
