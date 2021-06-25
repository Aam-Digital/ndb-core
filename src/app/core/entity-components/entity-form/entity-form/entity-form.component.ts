import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Entity } from "../../../entity/entity";
import { OperationType } from "../../../permissions/entity-permissions.service";
import { FormFieldConfig } from "./FormConfig";
import { FormGroup } from "@angular/forms";
import { EntityFormService } from "../entity-form.service";

@Component({
  selector: "app-entity-form",
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
})
export class EntityFormComponent implements OnInit {
  @Input() entity: Entity;
  @Input() creatingNew = false;
  @Input() set columns(columns: (FormFieldConfig | string)[][]) {
    this._columns = columns.map((row) =>
      row.map((field) => {
        if (typeof field === "string") {
          return { id: field };
        } else {
          return field;
        }
      })
    );
  }
  _columns: FormFieldConfig[][] = [];

  @Output() onSave = new EventEmitter<Entity>();

  operationType = OperationType;
  form: FormGroup;

  constructor(private entityFormService: EntityFormService) {}

  ngOnInit() {
    this.buildFormConfig();
    if (this.creatingNew) {
      this.switchEdit();
    }
  }

  switchEdit() {
    if (this.form.disabled) {
      this.form.enable();
    } else {
      this.form.disable();
    }
  }

  async save(): Promise<void> {
    this.entity = await this.entityFormService.saveChanges(this.form, this.entity);
    this.switchEdit();
    this.onSave.emit(this.entity);
  }

  cancel() {
    this.buildFormConfig();
  }

  private buildFormConfig() {
    const flattenedFormFields = new Array<FormFieldConfig>().concat(
      ...this._columns
    );
    this.entityFormService.extendFormFieldConfig(
      flattenedFormFields,
      this.entity
    );
    this.form = this.entityFormService.createFormGroup(
      flattenedFormFields,
      this.entity
    );
    this.form.disable();
  }
}
