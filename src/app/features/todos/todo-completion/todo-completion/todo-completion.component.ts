import { Component, Input } from "@angular/core";
import { Todo } from "../../model/todo";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import moment from "moment";
import { AlertService } from "../../../../core/alerts/alert.service";

@Component({
  selector: "app-todo-completion",
  templateUrl: "./todo-completion.component.html",
  styleUrls: ["./todo-completion.component.scss"],
})
export class TodoCompletionComponent {
  @Input() entity: Todo;

  constructor(
    private sessionService: SessionService,
    private alertService: AlertService,
    private entityMapper: EntityMapperService
  ) {}

  async completeClick() {
    const nextTodo = await this.createNextRepetition();

    this.entity.completed = {
      completedBy: this.sessionService.getCurrentUser().name,
      completedAt: new Date(),
      nextRepetition: nextTodo?.getId(true),
    };

    await this.entityMapper.save(this.entity);

    // TODO: user block instead of id to display in template
    // TODO: allow to "un-complete" a task again (+ ask user whether to delete next repetition task)
  }

  private async createNextRepetition(): Promise<Todo | null> {
    if (!this.entity.repetitionInterval) {
      return null;
    }

    const nextTodo = this.entity.copy(true);
    nextTodo.deadline = moment(nextTodo.deadline)
      .add(nextTodo.repetitionInterval.amount, nextTodo.repetitionInterval.unit)
      .toDate();

    await this.entityMapper.save(nextTodo);
    this.alertService.addInfo(
      $localize`:snackbar message informing about next recurring task:A new recurring ${Todo.label} has been created based on the repetition interval.`
    );

    return nextTodo;
  }
}
