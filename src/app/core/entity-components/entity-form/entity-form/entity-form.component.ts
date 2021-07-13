import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { OperationType } from "../../../permissions/entity-permissions.service";
import { FormFieldConfig } from "./FormConfig";
import { FormGroup } from "@angular/forms";
import { EntityFormService } from "../entity-form.service";
import { AlertService } from "../../../alerts/alert.service";

@Component({
  selector: "app-entity-form",
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
})
/**
 * A general purpose form component for displaying and editing entities.
 * It uses the FormFieldConfig interface for building the form fields but missing information are also fetched from
 * the entity's schema definitions. Properties with sufficient schema information can be displayed by only providing
 * the name of this property (and not an FormFieldConfig object).
 *
 * This component can be used directly or in a popup.
 * Inside the entity details component use the FormComponent which is part of the DYNAMIC_COMPONENT_MAP.
 */
export class EntityFormComponent implements OnInit {
  /**
   * The entity which should be displayed and edited
   */
  @Input() entity: Entity;

  /**
   * Whether the form should be opened in editing mode or not
   */
  @Input() editing = false;

  /**
   * The form field definitions. Either as a string or as a FormFieldConfig object.
   * Missing information will be fetched from the entity schema definition.
   * @param columns The columns which should be displayed
   */
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

  /**
   * This will be emitted whenever changes have been successfully saved to the entity.
   */
  @Output() save = new EventEmitter<Entity>();

  /**
   * This will be emitted whenever the cancel button is pressed.
   */
  @Output() cancel = new EventEmitter<void>();

  operationType = OperationType;
  form: FormGroup;

  constructor(
    private entityFormService: EntityFormService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.buildFormConfig();
    if (this.editing) {
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

  async saveClicked(): Promise<void> {
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.save.emit(this.entity);
      this.switchEdit();
    } catch (err) {
      this.alertService.addWarning(err.message);
    }
  }

  cancelClicked() {
    this.cancel.emit();
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
