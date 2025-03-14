import { Component, inject, OnInit } from "@angular/core";
import { Todo } from "../model/todo";
import { PrebuiltFilterConfig } from "../../../core/entity-list/EntityListConfig";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import moment from "moment";
import { EntityListComponent } from "../../../core/entity-list/entity-list/entity-list.component";
import {
  DataFilter,
  FilterSelectionOption,
} from "../../../core/filter/filters/filters";
import { RouteTarget } from "../../../route-target";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Sort } from "@angular/material/sort";
import { RouterLink } from "@angular/router";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { Logging } from "../../../core/logging/logging.service";
import {
  AsyncPipe,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet,
} from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2OnModule } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { FormsModule } from "@angular/forms";
import { FilterComponent } from "../../../core/filter/filter/filter.component";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { ExportDataDirective } from "../../../core/export/export-data-directive/export-data.directive";
import { DisableEntityOperationDirective } from "../../../core/permissions/permission-directive/disable-entity-operation.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityCreateButtonComponent } from "../../../core/common-components/entity-create-button/entity-create-button.component";
import { AbilityModule } from "@casl/angular";
import { ViewActionsComponent } from "../../../core/common-components/view-actions/view-actions.component";

@UntilDestroy()
@RouteTarget("TodoList")
@Component({
  selector: "app-todo-list",
  templateUrl:
    "../../../core/entity-list/entity-list/entity-list.component.html",
  standalone: true,

  imports: [
    NgIf,
    NgStyle,
    MatButtonModule,
    Angulartics2OnModule,
    FontAwesomeModule,
    MatMenuModule,
    NgTemplateOutlet,
    MatTabsModule,
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    EntitiesTableComponent,
    FormsModule,
    FilterComponent,
    TabStateModule,
    ViewTitleComponent,
    ExportDataDirective,
    DisableEntityOperationDirective,
    RouterLink,
    MatTooltipModule,
    EntityCreateButtonComponent,
    AbilityModule,
    AsyncPipe,
    ViewActionsComponent,
  ],
})
export class TodoListComponent
  extends EntityListComponent<Todo>
  implements OnInit
{
  // TODO: make this component obsolete by generalizing Entity and EntityList so that we can define a viewDetailsComponent on the entity that gets opened as popup? #2511

  override entityConstructor = Todo;

  override clickMode: "navigate" | "popup" | "none" = "none";

  override defaultSort: Sort = {
    active: "deadline",
    direction: "asc",
  };

  override showInactive = true;

  private readonly currentUser = inject(CurrentUserSubject);
  private readonly formDialog = inject(FormDialogService);

  ngOnInit() {
    this.addPrebuiltFilters();
  }

  private addPrebuiltFilters() {
    this.setFilterDefaultToCurrentUser();

    for (const prebuiltFilter of this.filters.filter(
      (filter) => filter.type === "prebuilt",
    )) {
      switch (prebuiltFilter.id) {
        case "due-status": {
          this.buildFilterDueStatus(
            prebuiltFilter as PrebuiltFilterConfig<Todo>,
          );
          break;
        }
        default: {
          Logging.warn(
            "[TodoList] No filter options available for prebuilt filter: " +
              prebuiltFilter.id,
          );
          prebuiltFilter["options"] = [];
        }
      }
    }
  }

  private setFilterDefaultToCurrentUser() {
    const assignedToFilter = this.filters.find((c) => c.id === "assignedTo");
    if (assignedToFilter && !assignedToFilter.default) {
      // filter based on currently logged-in user
      this.currentUser
        .pipe(untilDestroyed(this))
        .subscribe((entity) => (assignedToFilter.default = entity?.getId()));
    }
  }

  private buildFilterDueStatus(filter: PrebuiltFilterConfig<Todo>) {
    filter.options = [
      filterCurrentlyActive,
      {
        key: "overdue",
        label: $localize`:Filter-option for todos:Overdue`,
        filter: { isOverdue: true },
      },
      {
        key: "completed",
        label: $localize`:Filter-option for todos:Completed`,
        filter: { completed: { $exists: true } },
      },
      {
        key: "open",
        label: $localize`:Filter-option for todos:All Open`,
        filter: { completed: undefined },
      },
      { key: "", label: $localize`Any`, filter: {} },
    ];
    filter.label = filter.label ?? $localize`Tasks due`;
    filter.default = filter.default ?? "current";
  }

  override addNew() {
    this.showDetails(new Todo());
  }

  override onRowClick(entity: Todo) {
    this.showDetails(entity);
  }

  showDetails(entity: Todo) {
    this.formDialog.openFormPopup(entity, undefined, TodoDetailsComponent);
  }
}

const filterCurrentlyActive: FilterSelectionOption<Todo> = {
  key: "current",
  label: $localize`:Filter-option for todos:Currently Active`,
  filter: {
    $and: [
      { completed: undefined },
      {
        $or: [
          {
            startDate: {
              $exists: false,
            },
          },
          {
            startDate: {
              $lte: moment().format("YYYY-MM-DD"),
              $gt: "",
            },
          },
          {
            deadline: {
              $lte: moment().format("YYYY-MM-DD"),
              $gt: "",
            },
          },
        ],
      },
    ],
  } as DataFilter<Todo>,
};
