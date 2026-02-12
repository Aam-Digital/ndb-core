import { EventEmitter, inject, Injectable } from "@angular/core";
import { FormBuilder, FormControl, FormControlOptions } from "@angular/forms";
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
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DefaultValueService } from "../../default-values/default-value-service/default-value.service";
import {
  EntityForm,
  EntityFormGroup,
  EntityFormSavedEvent,
  TypedFormGroup,
} from "#src/app/core/common-components/entity-form/entity-form";
import { Logging } from "../../logging/logging.service";

/**
 * This service provides helper functions for creating tables or forms for an entity as well as saving
 * new changes correctly to the entity.
 */
@Injectable({ providedIn: "root" })
export class EntityFormService {
  private fb = inject(FormBuilder);
  private entityMapper = inject(EntityMapperService);
  private entitySchemaService = inject(EntitySchemaService);
  private dynamicValidator = inject(DynamicValidatorsService);
  private ability = inject(EntityAbility);
  private unsavedChanges = inject(UnsavedChangesService);
  private defaultValueService = inject(DefaultValueService);

  private subscriptions: Subscription[] = [];

  constructor() {
    const router = inject(Router);

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
    propertySchema: EntitySchemaField | undefined,
    forTable: boolean,
  ): FormFieldConfig {
    // formField config has precedence over schema
    const fullField = Object.assign(
      {},
      JSON.parse(JSON.stringify(propertySchema ?? {})), // deep copy to avoid modifying the original schema
      formField,
    );

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
   * Creates a form with the formFields and the existing values from the entity.
   * Missing fields in the formFields are filled with schema information.
   * @param formFields
   * @param entity
   * @param forTable
   * @param withPermissionCheck if true, fields without 'update' permissions will stay disabled when enabling form
   */
  public async createEntityForm<T extends Entity>(
    formFields: ColumnConfig[],
    entity: T,
    forTable = false,
    withPermissionCheck = true,
  ): Promise<EntityForm<T>> {
    const fields = formFields.map((f) =>
      this.extendFormFieldConfig(f, entity.getConstructor(), forTable),
    );

    const typedFormGroup: TypedFormGroup<Partial<T>> = this.createFormGroup(
      fields,
      entity,
      withPermissionCheck,
    );

    const entityForm: EntityForm<T> = {
      formGroup: typedFormGroup,
      entity: entity,
      fieldConfigs: fields,
      onFormStateChange: new EventEmitter(),
      inheritedParentValues: new Map(),
      watcher: new Map(),
    };

    await this.defaultValueService.handleEntityForm(entityForm, entity);

    return entityForm;
  }

  /**
   *
   * @param formFields The field configs in their final form (will not be extended by schema automatically)
   * @param entity
   * @param withPermissionCheck
   * @private
   */
  private createFormGroup<T extends Entity>(
    formFields: FormFieldConfig[],
    entity: T,
    withPermissionCheck = true,
  ): EntityFormGroup<T> {
    const formConfig = {};
    const copy = entity.copy();

    formFields = formFields.filter((f) =>
      entity.getSchema().has(toFormFieldConfig(f).id),
    );

    for (const f of formFields) {
      this.addFormControlConfig(formConfig, f, copy);
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
   * @param field The final field config (will not be automatically extended by schema)
   * @param entity
   * @private
   */
  private addFormControlConfig(
    formConfig: { [key: string]: FormControl },
    field: FormFieldConfig,
    entity: Entity,
  ) {
    let value = entity[field.id];

    const controlOptions: FormControlOptions = { nonNullable: true };
    if (field.validators) {
      const validators = this.dynamicValidator.buildValidators(
        field.validators,
        entity,
      );
      Object.assign(controlOptions, validators);
    }

    formConfig[field.id] = new FormControl(value, controlOptions);
  }

  private disableReadOnlyFormControls<T extends Entity>(
    form: EntityFormGroup<T>,
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
   * @param entityForm The formGroup holding the changes (marked pristine and disabled after successful save)
   * @param entity The entity on which the changes should be applied.
   * @returns a copy of the input entity with the changes from the form group
   */
  public async saveChanges<T extends Entity>(
    entityForm: EntityForm<T>,
    entity: T,
  ): Promise<T> {
    const form: EntityFormGroup<T> = entityForm.formGroup;

    this.checkFormValidity(form);

    const originalEntity = entity.copy();
    const updatedEntity = this.createUpdatedEntity(entity, form);
    updatedEntity.assertValid();
    this.assertPermissionsToSave(entity, updatedEntity);

    try {
      await this.entityMapper.save(updatedEntity);
    } catch (err) {
      Logging.debug("EntityFormService error saving", entity, err);
      throw new Error(`Could not save Entity from form service\: ${err}`);
    }
    this.unsavedChanges.pending = false;
    form.markAsPristine();
    form.disable();
    Object.assign(entity, updatedEntity);

    entityForm.onFormStateChange.emit(
      new EntityFormSavedEvent(entity, originalEntity),
    );
    return entity;
  }

  private checkFormValidity<T extends Entity>(form: EntityFormGroup<T>) {
    // errors regarding invalid fields won't be displayed unless marked as touched
    form.markAllAsTouched();
    if (form.invalid) {
      throw new InvalidFormFieldError();
    }
  }

  private createUpdatedEntity<T extends Entity>(
    entity: T,
    form: EntityFormGroup<T>,
  ) {
    const updatedEntity = entity.copy() as T;
    for (const [key, value] of Object.entries(form.getRawValue())) {
      if (value !== null) {
        updatedEntity[key] = value;
      } else {
        // formControls' value is null if it is empty (untouched or cleared by user) but we don't want entity docs to be full of null properties
        delete updatedEntity[key];
      }
    }
    return updatedEntity;
  }

  private assertPermissionsToSave(oldEntity: Entity, newEntity: Entity) {
    let action: "create" | "update", entity: Entity;
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

  resetForm<E extends Entity>(entityForm: EntityForm<E>, entity: E) {
    const form = entityForm.formGroup;
    for (const key of Object.keys(form.controls)) {
      form.get(key).setValue(entity[key]);
    }

    form.markAsPristine();
    this.unsavedChanges.pending = false;
    entityForm.onFormStateChange.emit("cancelled");
  }
}
