import { Injectable } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { FormFieldConfig } from "./entity-form/FormConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DynamicValidatorsService } from "./dynamic-form-validators/dynamic-validators.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntitySchema } from "../../entity/schema/entity-schema";

/**
 * This service provides helper functions for creating tables or forms for an entity as well as saving
 * new changes correctly to the entity.
 */
@Injectable()
export class EntityFormService {
  constructor(
    private fb: FormBuilder,
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService,
    private dynamicValidator: DynamicValidatorsService,
    private ability: EntityAbility
  ) {}

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

  public createFormGroup(
    formFields: FormFieldConfig[],
    entity: Entity
  ): FormGroup {
    const formConfig = {};
    const entitySchema = entity.getSchema();
    formFields
      .filter((formField) => entitySchema.get(formField.id))
      .forEach((formField) => {
        formConfig[formField.id] = [entity[formField.id]];
        if (formField.validators) {
          const validators = this.dynamicValidator.buildValidators(
            formField.validators
          );
          formConfig[formField.id].push(validators);
        }
      });
    return this.fb.group(formConfig);
  }

  public updateValues(formGroup: FormGroup, entity: Entity, staticKey: string) {
    // formGroup.setValue(entity);
    Object.keys(formGroup.controls).forEach((key) => {
      if (key != staticKey) {
        formGroup.controls[key].setValue(entity[key]);
      }
    });
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
    form: FormGroup,
    entity: T
  ): Promise<T> {
    this.checkFormValidity(form, entity.getSchema());
    const updatedEntity = entity.copy() as T;
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

  private checkFormValidity(form: FormGroup, schema: EntitySchema) {
    // errors regarding invalid fields wont be displayed unless marked as touched
    form.markAllAsTouched();
    if (form.invalid) {
      const invalidFields = this.getInvalidFields(form, schema);
      throw new Error($localize`Fields: "${invalidFields}" are invalid`);
    }
  }

  private getInvalidFields(form: FormGroup, schema: EntitySchema): string {
    return Object.keys(form.controls)
      .filter((key) => form.controls[key].invalid)
      .map((field) => schema.get(field).label)
      .join(", ");
  }

  private canSave(oldEntity: Entity, newEntity: Entity): boolean {
    // no _rev means a new entity is created
    if (oldEntity._rev) {
      return this.ability.can("update", oldEntity);
    } else {
      return this.ability.can("create", newEntity);
    }
  }
}
