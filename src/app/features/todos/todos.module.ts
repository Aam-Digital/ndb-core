import { NgModule } from "@angular/core";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { timeIntervalDatatype } from "./recurring-interval/time-interval.datatype";
import { Todo } from "./model/todo";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";

@NgModule({})
export class TodosModule {
  static databaseEntities = [Todo];

  constructor(
    components: ComponentRegistry,
    entitySchemaService: EntitySchemaService
  ) {
    entitySchemaService.registerSchemaDatatype(timeIntervalDatatype);
    components.addAll(dynamicComponents);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "TodoList",
    () =>
      import("./todo-list/todo-list.component").then(
        (c) => c.TodoListComponent
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
        (c) => c.TodosDashboardComponent
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
