import { Injectable } from "@angular/core";
import { FormBuilder, FormGroup, ɵElement } from "@angular/forms";
import { FormFieldConfig } from "./entity-form/FormConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DynamicValidatorsService } from "./dynamic-form-validators/dynamic-validators.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { InvalidFormFieldError } from "./invalid-form-field.error";
import { omit } from "lodash-es";

/**
 * These are utility types that allow to define the type of `FormGroup` the way it is returned by `EntityFormService.create`
 */
export type TypedForm<T> = FormGroup<{ [K in keyof T]: ɵElement<T[K], null> }>;
export type EntityForm<T extends Entity> = TypedForm<Partial<T>>;

/**
 * This service provides helper functions for creating tables or forms for an entity as well as saving
 * new changes correctly to the entity.
 */
@Injectable({ providedIn: "root" })
export class EntityFormService {
  constructor(
    private fb: FormBuilder,
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService,
    private dynamicValidator: DynamicValidatorsService,
    private ability: EntityAbility
  ) {}

  /**
   * Uses schema information to fill missing fields in the FormFieldConfig.
   * @param formFields
   * @param entityType
   * @param forTable
   */
  public extendFormFieldConfig(
    formFields: FormFieldConfig[],
    entityType: EntityConstructor,
    forTable = false
  ) {
    formFields.forEach((formField) => {
      try {
        this.addFormFields(formField, entityType, forTable);
      } catch (err) {
        throw new Error(
          `Could not create form config for ${formField.id}\: ${err}`
        );
      }
    });
  }

  private addFormFields(
    formField: FormFieldConfig,
    entityType: EntityConstructor,
    forTable: boolean
  ) {
    const propertySchema = entityType.schema.get(formField.id);
    formField.edit =
      formField.edit ||
      this.entitySchemaService.getComponent(propertySchema, "edit");
    formField.view =
      formField.view ||
      this.entitySchemaService.getComponent(propertySchema, "view");
    formField.tooltip = formField.tooltip || propertySchema?.description;
    formField.additional = formField.additional || propertySchema?.additional;
    if (forTable) {
      formField.forTable = true;
      formField.label =
        formField.label || propertySchema.labelShort || propertySchema.label;
    } else {
      formField.forTable = false;
      formField.label =
        formField.label || propertySchema.label || propertySchema.labelShort;
    }
    if (propertySchema?.validators) {
      formField.validators = propertySchema?.validators;
    }
  }

  /**
   * Creates a FormGroups from the formFields and the existing values from the entity.
   * Missing fields in the formFields are filled with schema information.
   * @param formFields
   * @param entity
   * @param forTable
   */
  public createFormGroup<T extends Entity>(
    formFields: FormFieldConfig[],
    entity: T,
    forTable = false
  ): EntityForm<T> {
    this.extendFormFieldConfig(formFields, entity.getConstructor(), forTable);
    const formConfig = {};
    const entitySchema = entity.getSchema();
    const copy = entity.copy();
    formFields
      .filter((formField) => entitySchema.get(formField.id))
      .forEach((formField) => {
        formConfig[formField.id] = [copy[formField.id]];
        if (formField.validators) {
          const validators = this.dynamicValidator.buildValidators(
            formField.validators
          );
          formConfig[formField.id].push(validators);
        }
      });
    return this.fb.group<Partial<T>>(formConfig);
  }

  /**
   * This function applies the changes of the formGroup to the entity.
   * If the form is invalid or the entity does not pass validation after applying the changes, an error will be thrown.
   * The input entity will not be modified but a copy of it will be returned in case of success.
   * @param form The formGroup holding the changes
   * @param entity The entity on which the changes should be applied.
   * @returns a copy of the input entity with the changes from the form group
   */
  public async saveChanges<T extends Entity>(
    form: EntityForm<T>,
    entity: T
  ): Promise<T> {
    this.checkFormValidity(form);
    const updatedEntity = entity.copy() as T;
    console.log("form", form.getRawValue());
    Object.assign(updatedEntity, form.getRawValue());
    updatedEntity.assertValid();
    if (!this.canSave(entity, updatedEntity)) {
      throw new Error(
        $localize`Current user is not permitted to save these changes`
      );
    }

    return this.entityMapper
      .save(updatedEntity)
      .then(() => Object.assign(entity, updatedEntity))
      .catch((err) => {
        throw new Error($localize`Could not save ${entity.getType()}\: ${err}`);
      });
  }

  private checkFormValidity<T extends Entity>(form: EntityForm<T>) {
    // errors regarding invalid fields wont be displayed unless marked as touched
    form.markAllAsTouched();
    if (form.invalid) {
      throw new InvalidFormFieldError();
    }
  }

  private canSave(oldEntity: Entity, newEntity: Entity): boolean {
    if (oldEntity.isNew) {
      return this.ability.can("create", newEntity);
    } else {
      return this.ability.can("update", oldEntity);
    }
  }

  resetForm<E extends Entity>(form: EntityForm<E>, entity: E) {
    // Patch form with values from the entity
    form.patchValue(entity as any);
    // Clear values that are not yet present on the entity
    const newKeys = Object.keys(omit(form.controls, Object.keys(entity)));
    newKeys.forEach((key) => form.get(key).setValue(null));
    form.markAsPristine();
  }
}
