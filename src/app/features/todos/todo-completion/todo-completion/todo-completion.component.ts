import {Component, EventEmitter, Input, Output} from "@angular/core";
import { Todo } from "../../model/todo";

@Component({
  selector: "app-todo-completion",
  templateUrl: "./todo-completion.component.html",
  styleUrls: ["./todo-completion.component.scss"],
})
export class TodoCompletionComponent {
  @Input() entity: Todo;

  @Output() complete = new EventEmitter();
  @Output() uncomplete = new EventEmitter();
}
