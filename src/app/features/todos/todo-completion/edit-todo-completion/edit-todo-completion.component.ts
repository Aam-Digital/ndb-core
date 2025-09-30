import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { EntityFormService } from "../../../../core/common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "../../../../core/common-components/entity-form/FormConfig";
import { EditComponent } from "../../../../core/common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../../../core/entity/model/entity";
import { Todo } from "../../model/todo";
import { TodoCompletion } from "../../model/todo-completion";
import { TodoService } from "../../todo.service";
import { DisplayTodoCompletionComponent } from "../display-todo-completion/display-todo-completion.component";

@DynamicComponent("EditTodoCompletion")
@Component({
  selector: "app-edit-todo-completion",
  templateUrl: "./edit-todo-completion.component.html",
  styleUrls: ["./edit-todo-completion.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    DisplayTodoCompletionComponent,
    MatTooltipModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditTodoCompletionComponent },
  ],
})
export class EditTodoCompletionComponent
  extends CustomFormControlDirective<TodoCompletion>
  implements EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Entity;

  private readonly entityFormService = inject(EntityFormService);
  private readonly todoService = inject(TodoService);
  private readonly dialogRef? = inject(MatDialogRef, { optional: true });

  get formControl(): FormControl<TodoCompletion> {
    return this.ngControl.control as FormControl<TodoCompletion>;
  }

  get todo(): Todo {
    return this.entity as Todo;
  }

  async completeTodo() {
    if (this.formControl.parent?.dirty) {
      // we assume the user always wants to save pending changes rather than discard them
      await this.entityFormService.saveChanges(
        { formGroup: this.formControl.parent } as any,
        this.todo,
      );
    }
    await this.todoService.completeTodo(this.todo);

    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  async uncompleteTodo() {
    await this.todoService.uncompleteTodo(this.todo);
  }
}
