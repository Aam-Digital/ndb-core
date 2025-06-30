import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DisplayTodoCompletionComponent } from "../display-todo-completion/display-todo-completion.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditComponent } from "../../../../core/entity/default-datatype/edit-component";
import { TodoCompletion } from "../../model/todo-completion";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityFormService } from "../../../../core/common-components/entity-form/entity-form.service";
import { TodoService } from "../../todo.service";
import { Todo } from "../../model/todo";
import { MatDialogRef } from "@angular/material/dialog";

@DynamicComponent("EditTodoCompletion")
@Component({
  selector: "app-edit-todo-completion",
  templateUrl: "./edit-todo-completion.component.html",
  styleUrls: ["./edit-todo-completion.component.scss"],
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    DisplayTodoCompletionComponent,
    MatTooltipModule,
  ],
})
export class EditTodoCompletionComponent extends EditComponent<
  TodoCompletion,
  Todo
> {
  private readonly entityFormService = inject(EntityFormService);
  private readonly todoService = inject(TodoService);
  private readonly dialogRef? = inject(MatDialogRef, { optional: true });

  async completeTodo() {
    if (this.entityForm.formGroup.dirty) {
      // we assume the user always wants to save pending changes rather than discard them
      await this.entityFormService.saveChanges(this.entityForm, this.entity);
    }
    await this.todoService.completeTodo(this.entity);

    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  async uncompleteTodo() {
    await this.todoService.uncompleteTodo(this.entity);
  }
}
