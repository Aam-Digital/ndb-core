import { FormControl, FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { Entity } from "../../../entity/model/entity";
import { Directive, Input, OnInit } from "@angular/core";

/**
 * A simple helper class which sets up all the required information for edit-components.
 * <T> refers to the type of the value which is processed in the component.
 */
@Directive()
export abstract class EditComponent<T> implements OnInit {
  /**
   * The configuration for this form field.
   */
  @Input() formFieldConfig: FormFieldConfig;

  /**
   * If available, the schema for the property which is displayed in this field.
   */
  @Input() propertySchema: EntitySchemaField;

  /**
   * The form control for this field which is part of a form group of the table/form component.
   */
  @Input() formControl: FormControl<T>;

  /**
   * The entity which is edited.
   */
  @Input() entity: Entity;
  /**
   * The tooltip to be displayed.
   */
  tooltip: string;

  /**
   * The name of the form control.
   */
  @Input() formControlName: string;

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

  ngOnInit() {
    if (!this.formFieldConfig?.forTable) {
      this.label = this.formFieldConfig?.label || this.propertySchema?.label;
    }
    if (this.formFieldConfig?.forTable) {
      this.tooltip = undefined;
    }
    this.additional =
      this.formFieldConfig?.additional ?? this.propertySchema?.additional;
    this.formControlName = this.formFieldConfig?.id;
    // This type casts are needed as the normal types throw errors in the templates
    this.parent = this.formControl.parent as FormGroup;
  }
}
