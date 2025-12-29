import { NgModule, inject } from "@angular/core";
import { Todo } from "./model/todo";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { TimeIntervalDatatype } from "./recurring-interval/time-interval.datatype";
import { DashboardWidgetRegistryService } from "../../core/dashboard/dashboard-widget-registry.service";

@NgModule({
  providers: [
    { provide: DefaultDatatype, useClass: TimeIntervalDatatype, multi: true },
  ],
})
export class TodosModule {
  static databaseEntities = [Todo];

  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register({
      component: "TodosDashboard",
      label: $localize`Todos`,
      settingsComponent: "TodosDashboardSettings",
      defaultConfig: {},
    });

    const components = inject(ComponentRegistry);

    components.addAll(dynamicComponents);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "TodosRelatedToEntity",
    () =>
      import("./todos-related-to-entity/todos-related-to-entity.component").then(
        (c) => c.TodosRelatedToEntityComponent,
      ),
  ],
  [
    "TodosDashboard",
    () =>
      import("./todos-dashboard/todos-dashboard.component").then(
        (c) => c.TodosDashboardComponent,
      ),
  ],
  [
    "EditRecurringInterval",
    () =>
      import("./recurring-interval/edit-recurring-interval/edit-recurring-interval.component").then(
        (c) => c.EditRecurringIntervalComponent,
      ),
  ],
  [
    "DisplayRecurringInterval",
    () =>
      import("./recurring-interval/display-recurring-interval/display-recurring-interval.component").then(
        (c) => c.DisplayRecurringIntervalComponent,
      ),
  ],
  [
    "EditTodoCompletion",
    () =>
      import("./todo-completion/edit-todo-completion/edit-todo-completion.component").then(
        (c) => c.EditTodoCompletionComponent,
      ),
  ],
  [
    "DisplayTodoCompletion",
    () =>
      import("./todo-completion/display-todo-completion/display-todo-completion.component").then(
        (c) => c.DisplayTodoCompletionComponent,
      ),
  ],
  [
    "TodosDashboardSettings",
    () =>
      import("./todos-dashboard-settings.component/todos-dashboard-settings.component").then(
        (c) => c.TodosDashboardSettingsComponent,
      ),
  ],
];
