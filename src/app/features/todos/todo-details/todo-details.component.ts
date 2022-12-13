import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import {ShowsEntity} from "../../../core/form-dialog/shows-entity.interface";
import {Todo} from "../model/todo";
import {FormDialogWrapperComponent} from "../../../core/form-dialog/form-dialog-wrapper/form-dialog-wrapper.component";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {DetailsComponentData} from "../../../core/entity-components/entity-subrecord/row-details/row-details.component";

@Component({
  selector: "app-todo-details",
  templateUrl: "./todo-details.component.html",
  styleUrls: ["./todo-details.component.scss"],
})
export class TodoDetailsComponent implements ShowsEntity<Todo>, OnInit {
  @Input() entity: Todo;

  @Output() close = new EventEmitter<Todo>();

  formDialogWrapper: FormDialogWrapperComponent<Todo> = {
    readonly: false,
    close: this.close,
  } as FormDialogWrapperComponent<Todo>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData<Todo>
  ) {
  }

  ngOnInit(): void {
  }
}
