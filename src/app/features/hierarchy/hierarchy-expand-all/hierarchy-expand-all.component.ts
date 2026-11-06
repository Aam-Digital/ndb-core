import { Component, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { HierarchyDataSource } from "../hierarchy-data-source";

/**
 * Button to collapse all records with sub-records, or to expand them all again.
 * A toolbar control of the {@link HierarchyDataSource}, shown while the list is arranged as a hierarchy.
 */
@Component({
  selector: "app-hierarchy-expand-all",
  imports: [MatButtonModule, MatTooltipModule, FaDynamicIconComponent],
  template: `
    @if (dataSource().activeField()) {
      @if (dataSource().anyExpanded()) {
        <button mat-stroked-button (click)="dataSource().collapseAll()">
          <app-fa-dynamic-icon
            icon="down-left-and-up-right-to-center"
            class="standard-icon-with-text"
            aria-hidden="true"
          ></app-fa-dynamic-icon>
          <span i18n="hierarchy|Button to hide all sub-records of a list"
            >Collapse all</span
          >
        </button>
      } @else {
        <button mat-stroked-button (click)="dataSource().expandAll()">
          <app-fa-dynamic-icon
            icon="up-right-and-down-left-from-center"
            class="standard-icon-with-text"
            aria-hidden="true"
          ></app-fa-dynamic-icon>
          <span i18n="hierarchy|Button to show all sub-records of a list"
            >Expand all</span
          >
        </button>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      min-height: 56px;
    }
  `,
})
export class HierarchyExpandAllComponent {
  dataSource = input.required<HierarchyDataSource<Entity>>();
}
