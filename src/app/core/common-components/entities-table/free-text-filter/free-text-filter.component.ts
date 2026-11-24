import { Component, effect, inject, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { UrlStateService } from "#src/app/utils/url-state/url-state.service";

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

  dataSource = input.required<EntitiesTableDataSource<Entity>>();

  private restoredDataSource?: EntitiesTableDataSource<Entity>;

  constructor() {
    effect((onCleanup) => {
      const dataSource = this.dataSource();
      const searchText = dataSource.searchText();
      const searchTextInUrl = this.urlState.getUrlParam(SEARCH_PARAM) ?? "";

      if (this.restoredDataSource !== dataSource) {
        this.restoredDataSource = dataSource;
        if (!searchText && searchTextInUrl) {
          dataSource.searchText.set(searchTextInUrl);
          return;
        }
      }

      if (searchText !== searchTextInUrl) {
        const timer = setTimeout(
          () =>
            this.urlState.updateUrlParams({
              [SEARCH_PARAM]: searchText || null,
            }),
          FREE_TEXT_URL_UPDATE_DELAY_MS,
        );
        onCleanup(() => clearTimeout(timer));
      }
    });
  }
}
