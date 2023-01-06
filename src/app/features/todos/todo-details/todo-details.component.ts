import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { Todo } from "../model/todo";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DetailsComponentData } from "../../../core/entity-components/entity-subrecord/row-details/row-details.component";
import { TodoService } from "../todo.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import {
  EntityForm,
  EntityFormService,
} from "../../../core/entity-components/entity-form/entity-form.service";
import { InvalidFormFieldError } from "../../../core/entity-components/entity-form/invalid-form-field.error";
import { AlertService } from "../../../core/alerts/alert.service";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../../core/entity/entity-remove.service";

@Component({
  selector: "app-todo-details",
  templateUrl: "./todo-details.component.html",
  styleUrls: ["./todo-details.component.scss"],
})
export class TodoDetailsComponent implements OnInit {
  @Input() entity: Todo;

  @Output() close = new EventEmitter<Todo>();

  formColumns: FormFieldConfig[][];
  form: EntityForm<Todo>;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: DetailsComponentData,
    private dialogRef: MatDialogRef<any>,
    private todoService: TodoService,
    private entityFormService: EntityFormService,
    private entityRemoveService: EntityRemoveService,
    private alertService: AlertService,
    private confirmationDialog: ConfirmationDialogService
  ) {
    this.entity = data.entity as Todo;
    this.formColumns = [data.columns];
  }

  ngOnInit(): void {
    this.form = this.entityFormService.createFormGroup(
      [].concat(...this.formColumns),
      this.entity
    );
  }

  cancel() {
    this.dialogRef.close();
  }

  async save() {
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.dialogRef.close();
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
  }

  async completeTodo() {
    if (this.form.dirty) {
      // we assume the user always wants to save pending changes rather than discard them
      await this.entityFormService.saveChanges(this.form, this.entity);
      /*
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
        await this.entityFormService.saveChanges(this.form, this.entity);
      }
      if (confirmationResult === false) {
        this.entityFormService.resetForm(this.form, this.entity);
      }
      */
    }
    await this.todoService.completeTodo(this.entity);
    this.dialogRef.close();
  }

  async uncompleteTodo() {
    await this.todoService.uncompleteTodo(this.entity);
  }

  delete() {
    //TODO: refactor this into a reusable form-actions component (duplicated from RowDetailsComponent)
    this.entityRemoveService.remove(this.entity).subscribe((res) => {
      if (res === RemoveResult.REMOVED) {
        this.dialogRef.close();
      }
    });
  }
}
