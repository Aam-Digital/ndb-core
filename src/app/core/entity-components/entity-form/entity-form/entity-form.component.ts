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
  @Input() columns: FormFieldConfig[][] = [];

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
    await this.entityFormService.saveChanges(this.form, this.entity);
    this.switchEdit();
    this.onSave.emit(this.entity);
  }

  cancel() {
    this.buildFormConfig();
  }

  private buildFormConfig() {
    const flattenedFormFields = new Array<FormFieldConfig>().concat(
      ...this.columns
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
