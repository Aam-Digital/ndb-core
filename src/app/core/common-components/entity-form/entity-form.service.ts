import { Injectable } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormControlOptions,
  FormGroup,
  ɵElement,
} from "@angular/forms";
import { ColumnConfig, FormFieldConfig, toFormFieldConfig } from "./FormConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DynamicValidatorsService } from "./dynamic-form-validators/dynamic-validators.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { InvalidFormFieldError } from "./invalid-form-field.error";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { ActivationStart, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "../../session/current-user-subject";

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
   * @param withPermissionCheck if true, fields without 'update' permissions will stay disabled when enabling form
   */
  public createFormGroup<T extends Entity>(
    formFields: ColumnConfig[],
    entity: T,
    forTable = false,
    withPermissionCheck = true,
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

    const valueChangesSubscription = group.valueChanges.subscribe(
      () => (this.unsavedChanges.pending = group.dirty),
    );
    this.subscriptions.push(valueChangesSubscription);

    if (withPermissionCheck) {
      this.disableReadOnlyFormControls(group, entity);
      const statusChangesSubscription = group.statusChanges
        .pipe(filter((status) => status !== "DISABLED"))
        .subscribe(() => this.disableReadOnlyFormControls(group, entity));
      this.subscriptions.push(statusChangesSubscription);
    }

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
    formConfig: { [key: string]: FormControl },
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

    const controlOptions: FormControlOptions = { nonNullable: true };
    if (field.validators) {
      const validators = this.dynamicValidator.buildValidators(
        field.validators,
      );
      Object.assign(controlOptions, validators);
    }

    formConfig[field.id] = new FormControl(value, controlOptions);
  }

  private getDefaultValue<T>(schema: EntitySchemaField) {
    let newVal;
    switch (schema.defaultValue) {
      case PLACEHOLDERS.NOW:
        newVal = new Date();
        break;
      case PLACEHOLDERS.CURRENT_USER:
        newVal = this.currentUser.value?.getId();
        break;
      default:
        newVal = schema.defaultValue;
    }
    if (newVal && schema.isArray) {
      newVal = [newVal];
    }
    return newVal;
  }

  private disableReadOnlyFormControls<T extends Entity>(
    form: EntityForm<T>,
    entity: T,
  ) {
    const action = entity.isNew ? "create" : "update";
    Object.keys(form.controls).forEach((fieldId) => {
      if (this.ability.cannot(action, entity, fieldId)) {
        form.get(fieldId).disable({ onlySelf: true, emitEvent: false });
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
    form: EntityForm<T>,
    entity: T,
  ): Promise<T> {
    this.checkFormValidity(form);

    const updatedEntity = entity.copy() as T;
    for (const [key, value] of Object.entries(form.getRawValue())) {
      if (value !== null) {
        updatedEntity[key] = value;
      }
    }

    updatedEntity.assertValid();
    this.assertPermissionsToSave(entity, updatedEntity);

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
    // errors regarding invalid fields won't be displayed unless marked as touched
    form.markAllAsTouched();
    if (form.invalid) {
      throw new InvalidFormFieldError();
    }
  }

  private assertPermissionsToSave(oldEntity: Entity, newEntity: Entity) {
    let action, entity;
    if (oldEntity.isNew) {
      action = "create";
      entity = newEntity;
    } else {
      action = "update";
      entity = oldEntity;
    }

    if (!this.ability.can(action, entity, undefined, true)) {
      const conditions = this.ability
        .rulesFor(action, entity.getType())
        .map((r) => r.conditions);

      throw new Error(
        $localize`Current user is not permitted to save these changes: ${JSON.stringify(
          conditions,
        )}`,
      );
    }
  }

  resetForm<E extends Entity>(form: EntityForm<E>, entity: E) {
    for (const key of Object.keys(form.controls)) {
      form.get(key).setValue(entity[key]);
    }

    form.markAsPristine();
    this.unsavedChanges.pending = false;
  }
}
