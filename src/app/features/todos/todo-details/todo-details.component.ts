import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { Todo } from "../model/todo";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { DetailsComponentData } from "../../../core/entity-components/entity-subrecord/row-details/row-details.component";
import { TodoService } from "../todo.service";
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
import { NgIf } from "@angular/common";
import { TodoCompletionComponent } from "../todo-completion/todo-completion/todo-completion.component";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DisableEntityOperationDirective } from "../../../core/permissions/permission-directive/disable-entity-operation.directive";
import { Angulartics2Module } from "angulartics2";

@Component({
  selector: "app-todo-details",
  templateUrl: "./todo-details.component.html",
  styleUrls: ["./todo-details.component.scss"],
  standalone: true,
  imports: [
    MatDialogModule,
    NgIf,
    TodoCompletionComponent,
    DialogCloseComponent,
    EntityFormComponent,
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    DisableEntityOperationDirective,
    Angulartics2Module,
  ],
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
    private alertService: AlertService
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
