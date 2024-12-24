import { FormControl, FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { Entity } from "../model/entity";
import { Directive, Input, OnChanges, OnInit } from "@angular/core";
import { DefaultValueConfig } from "../schema/default-value-config";
import { EntityForm } from "app/core/common-components/entity-form/entity-form.service";

/**
 * A simple helper class which sets up all the required information for edit-components.
 * <T> refers to the type of the value which is processed in the component.
 */
@Directive()
export abstract class EditComponent<T> implements OnInit, OnChanges {
  /**
   * The configuration for this form field.
   */
  @Input() formFieldConfig: FormFieldConfig;

  /**
   * The form control for this field which is part of a form group of the table/form component.
   */
  @Input() formControl: FormControl<T>;

  /**
   * The entity which is edited.
   */
  @Input() entity: Entity;

  /**
   * The form context with additional config and events.
   */
  @Input() entityForm: EntityForm<Entity>;

  /**
   * The name of the form control.
   */
  @Input() formControlName: string;

  /**
   * Describes the defaultValue behaviour for this field
   */
  @Input() defaultValueConfig: DefaultValueConfig | undefined;

  /**
   * A label for this component.
   */
  label: string;

  /**
   * The parent form of the `formControl` this is always needed to correctly setup the `mat-form-field`
   */
  parent: FormGroup;

  /**
   * Additional config details for the specific component implementation.
   * Can be defined through entity schema also.
   */
  additional?: any;

  /** indicating that the value is not in its original state, so that components can explain this to the user */
  isPartiallyAnonymized: boolean;

  ngOnInit() {
    if (!this.formFieldConfig?.forTable) {
      this.label = this.formFieldConfig?.label;
    }
    this.additional = this.formFieldConfig?.additional;
    this.formControlName = this.formFieldConfig?.id;
    // This type casts are needed as the normal types throw errors in the templates
    this.parent = this.formControl.parent as FormGroup;
  }

  ngOnChanges() {
    this.isPartiallyAnonymized =
      this.entity?.anonymized &&
      this.entity?.getSchema()?.get(this.formFieldConfig?.id)?.anonymize ===
        "retain-anonymized";
  }
}
