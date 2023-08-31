import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Todo } from "../model/todo";
import { RouteTarget } from "../../../app.routing";
import {
  EntityListConfig,
  PrebuiltFilterConfig,
} from "../../../core/entity-list/EntityListConfig";
import { RouteData } from "../../../core/config/dynamic-routing/view-config.interface";
import { SessionService } from "../../../core/session/session-service/session.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { TodoDetailsComponent } from "../todo-details/todo-details.component";
import { LoggingService } from "../../../core/logging/logging.service";
import moment from "moment";
import { EntityListComponent } from "../../../core/entity-list/entity-list/entity-list.component";
import { FilterSelectionOption } from "../../../core/filter/filters/filters";

@RouteTarget("TodoList")
@Component({
  selector: "app-todo-list",
  template: `
    <app-entity-list
      [listConfig]="listConfig"
      [entityConstructor]="entityConstructor"
      clickMode="none"
      (elementClick)="showDetails($event)"
      (addNewClick)="createNew()"
    ></app-entity-list>
  `,
  standalone: true,
  imports: [EntityListComponent],
})
export class TodoListComponent implements OnInit {
  // TODO: make this component obsolete by generalizing Entity and EntityList so that we can define a viewDetailsComponent on the entity that gets opened as popup?

  listConfig: EntityListConfig;
  entityConstructor = Todo;

  constructor(
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private formDialog: FormDialogService,
    private logger: LoggingService,
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data: RouteData<EntityListConfig>) =>
      this.init(data.config),
    );
  }

  private init(config: EntityListConfig) {
    this.listConfig = config;
    this.listConfig.defaultSort = this.listConfig.defaultSort ?? {
      active: "deadline",
      direction: "asc",
    };
    this.addPrebuiltFilters();
  }

  private addPrebuiltFilters() {
    this.setFilterDefaultToCurrentUser();

    for (const prebuiltFilter of this.listConfig.filters.filter(
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
          this.logger.warn(
            "[TodoList] No filter options available for prebuilt filter: " +
              prebuiltFilter.id,
          );
          prebuiltFilter["options"] = [];
        }
      }
    }
  }

  private setFilterDefaultToCurrentUser() {
    const assignedToFilter = this.listConfig.filters.find(
      (c) => c.id === "assignedTo",
    );
    if (assignedToFilter && !assignedToFilter.default) {
      assignedToFilter.default = this.sessionService.getCurrentUser().name;
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

  createNew() {
    this.showDetails(new Todo());
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
  },
};
