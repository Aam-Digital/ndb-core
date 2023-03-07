import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { Entity } from "../../../entity/model/entity";
import { Directive, Input } from "@angular/core";

/**
 * The interface for the configuration which is created by the form- or the entity-subrecord-component.
 */
export interface EditPropertyConfig<T> {
  /**
   * The configuration for this form field.
   */
  formFieldConfig: FormFieldConfig;

  /**
   * If available, the schema for the property which is displayed in this field.
   */
  propertySchema: EntitySchemaField;

  /**
   * The form control for this field which is part of a form group of the table/form component.
   */
  formControl: AbstractControl<T>;

  /**
   * The entity which is edited.
   */
  entity: Entity;
}

/**
 * A simple helper class which sets up all the required information for edit-components.
 * <T> refers to the type of the value which is processed in the component.
 */
@Directive()
export abstract class EditComponent<T> implements OnInitDynamicComponent {
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
   * The typed form control.
   */
  @Input() formControl: FormControl<T>;

  /**
   * The parent form of the `formControl` this is always needed to correctly setup the `mat-form-field`
   */
  parent: FormGroup;

  /**
   * The entity which is being edited.
   */
  @Input() entity: Entity;

  /**
   * Additional config details for the specific component implementation.
   * Can be defined through entity schema also.
   */
  additional?: any;

  onInitFromDynamicConfig(config: EditPropertyConfig<T>) {
    if (!config.formFieldConfig.forTable) {
      this.label = config.formFieldConfig.label || config.propertySchema?.label;
      this.tooltip = config.formFieldConfig.tooltip;
    }
    this.additional =
      config.formFieldConfig?.additional ?? config.propertySchema?.additional;
    this.formControlName = config.formFieldConfig.id;
    // This type casts are needed as the normal types throw errors in the templates
    this.formControl = config.formControl as FormControl<T>;
    this.parent = this.formControl.parent as FormGroup;
    this.entity = config.entity;
  }
}
