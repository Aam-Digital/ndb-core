import { Injectable, inject } from "@angular/core";
import { AlertService } from "../../core/alerts/alert.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { Todo } from "./model/todo";
import moment from "moment/moment";
import { CurrentUserSubject } from "../../core/session/current-user-subject";

@Injectable({
  providedIn: "root",
})
export class TodoService {
  private currentUser = inject(CurrentUserSubject);
  private alertService = inject(AlertService);
  private entityMapper = inject(EntityMapperService);


  async completeTodo(todo: Todo) {
    const nextTodo = await this.createNextRepetition(todo);

    todo.completed = {
      completedBy: this.currentUser.value?.getId(),
      completedAt: new Date(),
      nextRepetition: nextTodo?.getId(),
    };

    await this.entityMapper.save(todo);
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
