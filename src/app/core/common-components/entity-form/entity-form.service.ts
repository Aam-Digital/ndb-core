import { Injectable } from "@angular/core";
import { FormBuilder, FormGroup, ɵElement } from "@angular/forms";
import { FormFieldConfig } from "./entity-form/FormConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DynamicValidatorsService } from "./dynamic-form-validators/dynamic-validators.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { InvalidFormFieldError } from "./invalid-form-field.error";
import { omit } from "lodash-es";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { ActivationStart, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { isArrayDataType } from "../../basic-datatypes/datatype-utils";
import { CurrentUserSubject } from "../../user/user";
import {
  ColumnConfig,
  toFormFieldConfig,
} from "../entity-subrecord/entity-subrecord/entity-subrecord-config";

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
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService,
    private dynamicValidator: DynamicValidatorsService,
    private ability: EntityAbility,
    private unsavedChanges: UnsavedChangesService,
    private currentUser: CurrentUserSubject,
    router: Router,
  ) {
    router.events
      .pipe(filter((e) => e instanceof ActivationStart))
      .subscribe(() => {
        // Clean up everything once navigation happens
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.subscriptions = [];
        this.unsavedChanges.pending = false;
      });
  }

  /**
   * Uses schema information to fill missing fields in the FormFieldConfig.
   * @param formField
   * @param entityType
   * @param forTable
   */
  public extendFormFieldConfig(
    formField: ColumnConfig,
    entityType: EntityConstructor,
    forTable = false,
  ): FormFieldConfig {
    const fullField = toFormFieldConfig(formField);
    try {
      return this.addSchemaToFormField(
        fullField,
        entityType.schema.get(fullField.id),
        forTable,
      );
    } catch (err) {
      throw new Error(
        `Could not create form config for ${fullField.id}: ${err}`,
      );
    }
  }

  private addSchemaToFormField(
    formField: FormFieldConfig,
    propertySchema: EntitySchemaField,
    forTable: boolean,
  ): FormFieldConfig {
    // formField config has precedence over schema
    const fullField = Object.assign({}, propertySchema, formField);

    fullField.editComponent =
      fullField.editComponent ||
      this.entitySchemaService.getComponent(propertySchema, "edit");
    fullField.viewComponent =
      fullField.viewComponent ||
      this.entitySchemaService.getComponent(propertySchema, "view");

    if (forTable) {
      fullField.forTable = true;
      fullField.label =
        fullField.label || fullField.labelShort || fullField.label;
      delete fullField.description;
    } else {
      fullField.forTable = false;
      fullField.label =
        fullField.label || fullField.label || fullField.labelShort;
    }

    return fullField;
  }

  /**
   * Creates a FormGroups from the formFields and the existing values from the entity.
   * Missing fields in the formFields are filled with schema information.
   * @param formFields
   * @param entity
   * @param forTable
   */
  public createFormGroup<T extends Entity>(
    formFields: ColumnConfig[],
    entity: T,
    forTable = false,
  ): EntityForm<T> {
    const formConfig = {};
    const copy = entity.copy();

    formFields = formFields.filter((f) =>
      entity.getSchema().has(toFormFieldConfig(f).id),
    );

    for (const f of formFields) {
      this.addFormControlConfig(formConfig, f, copy, forTable);
    }
    const group = this.fb.group<Partial<T>>(formConfig);

    const sub = group.valueChanges.subscribe(
      () => (this.unsavedChanges.pending = group.dirty),
    );
    this.subscriptions.push(sub);

    return group;
  }

  /**
   * Add a property with form control initialization config to the given formConfig object.
   * @param formConfig
   * @param fieldConfig
   * @param entity
   * @param forTable
   * @private
   */
  private addFormControlConfig(
    formConfig: Object,
    fieldConfig: ColumnConfig,
    entity: Entity,
    forTable: boolean,
  ) {
    const field = this.extendFormFieldConfig(
      fieldConfig,
      entity.getConstructor(),
      forTable,
    );

    let value = entity[field.id];
    if (
      entity.isNew &&
      field.defaultValue &&
      (!value || (value as []).length === 0)
    ) {
      value = this.getDefaultValue(field);
    }
    formConfig[field.id] = [value];

    if (field.validators) {
      const validators = this.dynamicValidator.buildValidators(
        field.validators,
      );
      formConfig[field.id].push(validators);
    }
  }

  private getDefaultValue<T>(schema: EntitySchemaField) {
    let newVal;
    switch (schema.defaultValue) {
      case PLACEHOLDERS.NOW:
        newVal = new Date();
        break;
      case PLACEHOLDERS.CURRENT_USER:
        newVal = this.currentUser.value.name;
        break;
      default:
        newVal = schema.defaultValue;
    }
    if (isArrayDataType(schema.dataType)) {
      newVal = [newVal];
    }
    return newVal;
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
    entity: T,
  ): Promise<T> {
    this.checkFormValidity(form);
    const updatedEntity = entity.copy() as T;
    Object.assign(updatedEntity, form.getRawValue());
    updatedEntity.assertValid();
    if (!this.canSave(entity, updatedEntity)) {
      throw new Error(
        $localize`Current user is not permitted to save these changes`,
      );
    }

    return this.entityMapper
      .save(updatedEntity)
      .then(() => {
        this.unsavedChanges.pending = false;
        return Object.assign(entity, updatedEntity);
      })
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
    this.unsavedChanges.pending = false;
  }
}
