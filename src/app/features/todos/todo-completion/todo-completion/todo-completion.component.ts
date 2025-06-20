import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Todo } from "../../model/todo";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DisplayTodoCompletionComponent } from "../display-todo-completion/display-todo-completion.component";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-todo-completion",
  templateUrl: "./todo-completion.component.html",
  styleUrls: ["./todo-completion.component.scss"],
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    DisplayTodoCompletionComponent,
    MatTooltipModule,
  ],
})
export class TodoCompletionComponent {
  @Input() entity: Todo;

  @Output() complete = new EventEmitter();
  @Output() uncomplete = new EventEmitter();
}
