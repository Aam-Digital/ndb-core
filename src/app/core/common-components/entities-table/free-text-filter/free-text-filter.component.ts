import { Location } from "@angular/common";
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { NavigationStart, Router } from "@angular/router";
import { filter } from "rxjs";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { UrlStateService } from "#src/app/utils/url-state/url-state.service";
import { getPathOfUrl } from "#src/app/utils/utils";

/** URL query param of the search text (with the "_" prefix of view state other than filters, see `UrlStateService`) */
const SEARCH_PARAM = "_search";

/**
 * Delay (ms) before the search text is written to the URL, so that typing does not
 * replace the browser history entry on every keystroke.
 */
export const FREE_TEXT_URL_UPDATE_DELAY_MS = 400;

/**
 * The "Filter" field to search the records of a table by free text.
 *
 * The toolbar control of data sources that apply their `searchText`
 * (see {@link EntitiesTableDataSource.toolbarControls}).
 * The search text is kept in the URL, so that it is still applied when the user
 * comes back to the list, e.g. from the details page of a record.
 */
@Component({
  selector: "app-free-text-filter",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FaDynamicIconComponent,
  ],
  template: `
    <mat-form-field class="full-width">
      <mat-label
        i18n="Filter placeholder|Allows the user to filter through entities"
        >Filter
      </mat-label>
      <input
        #searchInput
        class="full-width"
        matInput
        i18n-placeholder="Examples of things to filter"
        placeholder="e.g. name, age"
        [value]="dataSource().searchText()"
        (input)="dataSource().searchText.set(searchInput.value)"
      />
      @if (dataSource().searchText()) {
        <button
          mat-icon-button
          matIconSuffix
          i18n-aria-label
          aria-label="Clear"
          (click)="dataSource().searchText.set('')"
        >
          <app-fa-dynamic-icon icon="times"></app-fa-dynamic-icon>
        </button>
      }
    </mat-form-field>
  `,
  styleUrl: "./free-text-filter.component.scss",
})
export class FreeTextFilterComponent {
  private readonly urlState = inject(UrlStateService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  dataSource = input.required<EntitiesTableDataSource<Entity>>();

  /** The search text in the URL, following the browser's Back and Forward. */
  private readonly searchTextInUrl = this.urlState.watchUrlParam(SEARCH_PARAM);

  private restoredDataSource?: EntitiesTableDataSource<Entity>;
  private knownSearchTextInUrl?: string;

  /** The search text that is not yet written to the URL (as the delay has not passed). */
  private pendingSearchText?: { text: string };
  private pendingWrite?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const dataSource = this.dataSource();
      const searchText = dataSource.searchText();
      const searchTextInUrl = this.searchTextInUrl() ?? "";
      untracked(() =>
        this.syncWithUrl(dataSource, searchText, searchTextInUrl),
      );
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.pendingWrite));

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.keepPendingSearchTextInHistory(event.url));
  }

  private syncWithUrl(
    dataSource: EntitiesTableDataSource<Entity>,
    searchText: string,
    searchTextInUrl: string,
  ) {
    const urlChanged = searchTextInUrl !== this.knownSearchTextInUrl;
    this.knownSearchTextInUrl = searchTextInUrl;

    if (this.restoredDataSource !== dataSource) {
      this.restoredDataSource = dataSource;
      if (!searchText && searchTextInUrl) {
        dataSource.searchText.set(searchTextInUrl);
        return;
      }
    } else if (urlChanged && !this.pendingSearchText) {
      // The user went back or forward to another URL.
      // While a write is pending, a change of the URL is only an earlier write arriving.
      dataSource.searchText.set(searchTextInUrl);
      return;
    }

    this.scheduleUrlUpdate(searchText, searchTextInUrl);
  }

  private scheduleUrlUpdate(searchText: string, searchTextInUrl: string) {
    clearTimeout(this.pendingWrite);
    this.pendingSearchText = undefined;
    if (searchText === searchTextInUrl) {
      return;
    }

    this.pendingSearchText = { text: searchText };
    this.pendingWrite = setTimeout(() => {
      this.pendingSearchText = undefined;
      this.urlState.updateUrlParams({ [SEARCH_PARAM]: searchText || null });
    }, FREE_TEXT_URL_UPDATE_DELAY_MS);
  }

  /**
   * A record can be opened before the delay has passed (e.g. a click right after typing),
   * which would lose the search text when the user comes back.
   * So when the user leaves the list, the text is put into the current history entry.
   * This must not be a router navigation: that would replace the one that has just started.
   */
  private keepPendingSearchTextInHistory(targetUrl: string) {
    const currentUrl = this.router.url;
    if (
      !this.pendingSearchText ||
      getPathOfUrl(targetUrl) === getPathOfUrl(currentUrl)
    ) {
      return;
    }

    const urlTree = this.router.parseUrl(currentUrl);
    if (this.pendingSearchText.text) {
      urlTree.queryParams[SEARCH_PARAM] = this.pendingSearchText.text;
    } else {
      delete urlTree.queryParams[SEARCH_PARAM];
    }
    this.location.replaceState(
      urlTree.toString(),
      "",
      this.location.getState(),
    );
  }
}
