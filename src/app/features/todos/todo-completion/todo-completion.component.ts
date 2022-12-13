import {Component, Input} from "@angular/core";
import {Todo} from "../model/todo";
import {SessionService} from "../../../core/session/session-service/session.service";

@Component({
  selector: "app-todo-completion",
  templateUrl: "./todo-completion.component.html",
  styleUrls: ["./todo-completion.component.scss"],
})
export class TodoCompletionComponent {
  @Input() entity: Todo;

  constructor(private sessionService: SessionService) {
  }

  completeClick() {
    this.entity.completed = {
      completedBy: this.sessionService.getCurrentUser().name,
      completedAt: new Date(),
    };

    // TODO: user block instead of id to display in template

    // TODO: allow to "un-complete" a task again (+ ask user whether to delete next repetition task)
    // TODO: move into taskcomponent instead of form field level
    this.createNextRepetition();
  }

  private createNextRepetition() {
  }
}
