import { Component } from "@angular/core";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../../core/entity-components/entity-utils/view-components/view.directive";
import { TodoCompletion } from "../../model/todo-completion";

@DynamicComponent("DisplayTodoCompletion")
@Component({
  selector: "app-display-todo-completion",
  templateUrl: "./display-todo-completion.component.html",
  styleUrls: ["./display-todo-completion.component.scss"],
})
export class DisplayTodoCompletionComponent extends ViewDirective<TodoCompletion> {}
