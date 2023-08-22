import { Component } from "@angular/core";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../../core/entity/default-datatype/view.directive";
import { TodoCompletion } from "../../model/todo-completion";
import { DatePipe, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@DynamicComponent("DisplayTodoCompletion")
@Component({
  selector: "app-display-todo-completion",
  templateUrl: "./display-todo-completion.component.html",
  styleUrls: ["./display-todo-completion.component.scss"],
  standalone: true,
  imports: [NgIf, FontAwesomeModule, DatePipe],
})
export class DisplayTodoCompletionComponent extends ViewDirective<TodoCompletion> {}
