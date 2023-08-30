import { Injectable } from "@angular/core";
import { AlertService } from "../../core/alerts/alert.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { Todo } from "./model/todo";
import moment from "moment/moment";
import { UserService } from "../../core/user/user.service";

@Injectable({
  providedIn: "root",
})
export class TodoService {
  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private entityMapper: EntityMapperService,
  ) {}

  async completeTodo(todo: Todo) {
    const nextTodo = await this.createNextRepetition(todo);

    todo.completed = {
      completedBy: this.userService.getCurrentUser().name,
      completedAt: new Date(),
      nextRepetition: nextTodo?.getId(true),
    };

    await this.entityMapper.save(todo);

    // TODO: user block instead of id to display in template
  }

  private async createNextRepetition(originalTodo: Todo): Promise<Todo | null> {
    if (!originalTodo.repetitionInterval) {
      return null;
    }

    const nextTodo = originalTodo.copy(true);
    nextTodo.deadline = moment(nextTodo.deadline)
      .add(nextTodo.repetitionInterval.amount, nextTodo.repetitionInterval.unit)
      .toDate();

    await this.entityMapper.save(nextTodo);
    this.alertService.addInfo(
      $localize`:snackbar message informing about next recurring task:A new recurring ${Todo.label} has been created based on the repetition interval.`,
    );

    return nextTodo;
  }

  async uncompleteTodo(todo: Todo) {
    todo.completed = undefined;
    await this.entityMapper.save(todo);
    // we do not delete recurring todos created when completing this for now
  }
}
