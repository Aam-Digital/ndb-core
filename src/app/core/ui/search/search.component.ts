import { Component, OnInit } from "@angular/core";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { Entity } from "../../entity/entity";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Subject } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";
import { LoggingService } from "../../logging/logging.service";
import { LogLevel } from "../../logging/log-level";
import { AlertService } from "../../alerts/alert.service";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { Router } from "@angular/router";

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
export class SearchComponent implements OnInit {
  results = [];
  searchText = "";
  showSearchToolbar = false;
  isSearching: boolean = false;

  MIN_CHARACTERS_FOR_SEARCH: number = 3;
  INPUT_DEBOUNCE_TIME_MS: number = 400;

  searchStringChanged: Subject<string> = new Subject<string>();
  searchQuery: Subject<Promise<any>> = new Subject<Promise<any>>();

  constructor(
    private dbIndexingService: DatabaseIndexingService,
    private entitySchemaService: EntitySchemaService,
    private router: Router,
    private loggingService: LoggingService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.createSearchIndex();

    this.searchStringChanged
      .pipe(debounceTime(this.INPUT_DEBOUNCE_TIME_MS))
      .subscribe((searchString) => {
        if (typeof searchString !== "string") {
          // abort if a result object was selected rather than a search term entered
          return;
        }

        this.searchQuery.next(this.startSearch(searchString));
      });

    this.searchQuery
      .pipe(
        switchMap((value) => {
          return value;
        })
      )
      .subscribe(
        (result: { queryResults: any; searchTerms: string[] }) => {
          this.handleSearchQueryResult(result);
        },
        (error) => {
          this.loggingService.log(
            {
              message: "[Search] An error has occurred in a search query.",
              error,
            },
            LogLevel.ERROR
          );
          this.alertService.addWarning(
            "An error has occurred in your search query. Please try again."
          );
        }
      );
  }

  async startSearch(searchString: string): Promise<any> {
    this.isSearching = true;
    this.results = [];

    if (!searchString) {
      return Promise.resolve();
    }

    searchString = searchString.toLowerCase();

    if (!this.isRelevantSearchInput(searchString)) {
      return Promise.resolve();
    }

    const searchTerms = searchString.split(" ");

    const queryResults = await this.dbIndexingService.queryIndex(
      "search_index/by_name",
      {
        startkey: searchTerms[0],
        endkey: searchTerms[0] + "\ufff0",
        include_docs: true,
      }
    );

    return {
      queryResults,
      searchTerms,
    };
  }

  async clickOption(optionElement) {
    const resultEntity: Entity = optionElement.value;
    await this.router.navigate([
      resultEntity.getType().toLowerCase(),
      resultEntity.getId(),
    ]);

    this.searchText = "";
    this.showSearchToolbar = false;
  }

  toggleSearchToolbar() {
    this.showSearchToolbar = !this.showSearchToolbar;
  }

  handleSearchQueryResult(result: {
    queryResults: any;
    searchTerms: string[];
  }) {
    this.isSearching = false;

    if (!result || !result.queryResults) {
      this.results = [];
      return;
    }

    this.results = this.prepareResults(
      result.queryResults.rows,
      result.searchTerms
    );
  }

  private createSearchIndex(): Promise<any> {
    // `emit(x)` to add x as a key to the index that can be searched
    const searchMapFunction =
      "(doc) => {" +
      'if (doc.hasOwnProperty("searchIndices")) { doc.searchIndices.forEach(word => emit(word.toString().toLowerCase())) }' +
      "}";

    const designDoc = {
      _id: "_design/search_index",
      views: {
        by_name: {
          map: searchMapFunction,
        },
      },
    };

    return this.dbIndexingService.createIndex(designDoc);
  }

  /**
   * Check if the input should start an actual search.
   * Only search for words starting with a char or number -> no searching for space or no input
   * @param searchText
   */
  private isRelevantSearchInput(searchText: string) {
    const regexp = new RegExp("[a-z]+|[0-9]+");
    return (
      searchText.match(regexp) &&
      searchText.length >= this.MIN_CHARACTERS_FOR_SEARCH
    );
  }

  private prepareResults(rows, searchTerms: string[]): any[] {
    return this.getResultsWithoutDuplicates(rows)
      .map((doc) => this.transformDocToEntity(doc))
      .filter((r) => r !== null)
      .filter((r) => this.containsSecondarySearchTerms(r, searchTerms))
      .sort((a, b) => this.sortResults(a, b));
  }

  private getResultsWithoutDuplicates(rows): any[] {
    const filteredResults = new Map<string, any>();
    for (const row of rows) {
      filteredResults.set(row.id, row.doc);
    }
    return Array.from(filteredResults.values());
  }

  private transformDocToEntity(doc: any): Entity {
    let resultEntity;
    if (doc._id.startsWith(Child.ENTITY_TYPE + ":")) {
      resultEntity = new Child(doc.entityId);
    } else if (doc._id.startsWith(School.ENTITY_TYPE + ":")) {
      resultEntity = new School(doc.entityId);
    }

    if (resultEntity) {
      this.entitySchemaService.loadDataIntoEntity(resultEntity, doc);
      return resultEntity;
    } else {
      return null;
    }
  }

  private containsSecondarySearchTerms(item, searchTerms: string[]) {
    const itemKey = item.generateSearchIndices().join(" ").toLowerCase();
    for (let i = 1; i < searchTerms.length; i++) {
      if (!itemKey.includes(searchTerms[i])) {
        return false;
      }
    }
    return true;
  }

  private sortResults(a, b) {
    const entityComparison = this.compareEntityTypes(a, b);
    if (entityComparison === 0) {
      return a.toString().localeCompare(b.toString());
    } else {
      return entityComparison;
    }
  }

  private compareEntityTypes(a: Entity, b: Entity) {
    const e = [a, b];
    const t = [a.getType(), b.getType()];

    // special sorting for Child entities
    for (let i = 0; i < 2; i++) {
      if (e[i].getType() === Child.ENTITY_TYPE) {
        if ((e[i] as Child).isActive()) {
          // show first
          t[i] = "!" + t[i];
        } else {
          // show last
          t[i] = "\ufff0" + t[i];
        }
      }
    }

    return t[0].localeCompare(t[1]);
  }
}
