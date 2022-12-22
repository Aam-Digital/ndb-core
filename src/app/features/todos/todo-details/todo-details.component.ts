import {
  Component,
  EventEmitter,
  Inject,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { Todo } from "../model/todo";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DetailsComponentData } from "../../../core/entity-components/entity-subrecord/row-details/row-details.component";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { TodoService } from "../todo.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { YesNoCancelButtons } from "../../../core/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";

@Component({
  selector: "app-todo-details",
  templateUrl: "./todo-details.component.html",
  styleUrls: ["./todo-details.component.scss"],
})
export class TodoDetailsComponent {
  @Input() entity: Todo;

  @Output() close = new EventEmitter<Todo>();

  @ViewChild(EntityFormComponent) entityForm;

  formColumns: FormFieldConfig[][];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: DetailsComponentData<Todo>,
    private dialogRef: MatDialogRef<any>,
    private todoService: TodoService,
    private confirmationDialog: ConfirmationDialogService
  ) {
    this.entity = data.entity;
    this.formColumns = [data.columns];
  }

  cancel() {
    this.dialogRef.close();
  }

  async save() {
    // TODO: handle invalid forms (currently it somehow just silently fails to save ...)
    await this.entityForm.saveForm();
    this.dialogRef.close();
  }

  async completeTodo() {
    if (this.entityForm.form.dirty) {
      const confirmationResult = await this.confirmationDialog.getConfirmation(
        $localize`Save changes?`,
        $localize`Do you want to save your changes to the ${Todo.label} before marking it as completed? Otherwise, changes will be discarded.`,
        YesNoCancelButtons
      );

      if (confirmationResult === undefined) {
        // cancel
        return;
      }
      if (confirmationResult === true) {
        await this.entityForm.saveForm();
      }
      if (confirmationResult === false) {
        this.entityForm.resetForm();
      }
    }
    await this.todoService.completeTodo(this.entity);
    this.dialogRef.close();
  }

  async uncompleteTodo() {
    await this.todoService.uncompleteTodo(this.entity);
  }

  delete() {
    //TODO: handle delete (or delegate it to a reusable form-actions component)
  }
}
