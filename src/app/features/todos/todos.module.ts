import { NgModule } from "@angular/core";
import { Todo } from "./model/todo";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { DefaultDatatype } from "../../core/entity/schema/datatype-default";
import { TimeIntervalDatatype } from "./recurring-interval/time-interval.datatype";

@NgModule({
  providers: [
    { provide: DefaultDatatype, useClass: TimeIntervalDatatype, multi: true },
  ],
})
export class TodosModule {
  static databaseEntities = [Todo];

  constructor(components: ComponentRegistry) {
    components.addAll(dynamicComponents);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "TodoList",
    () =>
      import("./todo-list/todo-list.component").then(
        (c) => c.TodoListComponent,
      ),
  ],
  [
    "TodosRelatedToEntity",
    () =>
      import(
        "./todos-related-to-entity/todos-related-to-entity.component"
      ).then((c) => c.TodosRelatedToEntityComponent),
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
      import(
        "./recurring-interval/edit-recurring-interval/edit-recurring-interval.component"
      ).then((c) => c.EditRecurringIntervalComponent),
  ],
  [
    "DisplayRecurringInterval",
    () =>
      import(
        "./recurring-interval/display-recurring-interval/display-recurring-interval.component"
      ).then((c) => c.DisplayRecurringIntervalComponent),
  ],
  [
    "DisplayTodoCompletion",
    () =>
      import(
        "./todo-completion/display-todo-completion/display-todo-completion.component"
      ).then((c) => c.DisplayTodoCompletionComponent),
  ],
];
