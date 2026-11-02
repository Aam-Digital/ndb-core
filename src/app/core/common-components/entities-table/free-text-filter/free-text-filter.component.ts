import { Component, input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";

/**
 * The "Filter" field to search the records of a table by free text.
 *
 * The toolbar control of data sources that apply their `searchText`
 * (see {@link EntitiesTableDataSource.toolbarControls}).
 */
@Component({
  selector: "app-free-text-filter",
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FaDynamicIconComponent,
  ],
  template: `
    <mat-form-field class="full-width filter-field">
      <mat-label
        i18n="Filter placeholder|Allows the user to filter through entities"
        >Filter
      </mat-label>
      <input
        class="full-width"
        matInput
        i18n-placeholder="Examples of things to filter"
        placeholder="e.g. name, age"
        [ngModel]="dataSource().searchText()"
        (ngModelChange)="dataSource().searchText.set($event)"
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
  dataSource = input.required<EntitiesTableDataSource<Entity>>();
}
