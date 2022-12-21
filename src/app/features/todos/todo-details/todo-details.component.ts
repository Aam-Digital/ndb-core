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

@Component({
  selector: "app-todo-details",
  templateUrl: "./todo-details.component.html",
  styleUrls: ["./todo-details.component.scss"],
})
export class TodoDetailsComponent {
  @Input() entity: Todo;

  @Output() close = new EventEmitter<Todo>();

  @ViewChild(EntityFormComponent) entityForm;

  formColumns: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: DetailsComponentData<Todo>,
    private dialogRef: MatDialogRef<any>
  ) {
    this.entity = data.entity;
    this.formColumns = [data.columns];
  }

  cancel() {
    this.dialogRef.close();
  }

  async save() {
    // TODO ask to save changes before completing a task (which saves it)
    await this.entityForm.saveForm();
    this.dialogRef.close();
  }
}
