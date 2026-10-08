import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";
import { Entity } from "../../core/entity/model/entity";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../../core/default-values/default-value-strategy.interface";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { DefaultValueHint } from "../../core/default-values/default-value-service/default-value.service";
import { asArray } from "../../utils/asArray";
import { FormFieldConfig } from "../../core/common-components/entity-form/FormConfig";
import {
  DefaultValueConfigInheritedField,
  isCollectingFromLinkedRecords,
} from "./inherited-field-config";
import { getCommonValue } from "./get-common-value";
import { isEqual, xorWith } from "lodash-es";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { AutomatedFieldUpdateConfigService } from "./automated-field-update/automated-field-update-config.service";
import { Logging } from "../../core/logging/logging.service";

/**
 * An advanced default-value strategy that sets values based on the value in a referenced related entity.
 *
 * This allows to configure hierarchies and inherited fields,
 * e.g. setting the category field based on the category field in a linked "parent entity".
 */
@Injectable({
  providedIn: "root",
})
export class InheritedValueService extends DefaultValueStrategy {
  override readonly mode = "inherited-field";

  private readonly entityMapper = inject(EntityMapperService);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly automatedFieldUpdateConfigService = inject(
    AutomatedFieldUpdateConfigService,
  );

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component =
      await import("./admin-inherited-field/admin-inherited-field.component").then(
        (c) => c.AdminInheritedFieldComponent,
      );

    return {
      mode: this.mode,
      component,
      icon: "circle-nodes",
      description: $localize`value inherited or auto-updated from related records`,
    };
  }

  override async initEntityForm<T extends Entity>(form: EntityForm<T>) {
    await this.updateLinkedEntities(form);
    await this.collectValuesOfLinkedRecords(form);
  }

  /**
   * For fields collecting the values of all records that link to this entity,
   * load these records once to be able to compare and sync the field's value.
   */
  private async collectValuesOfLinkedRecords<T extends Entity>(
    form: EntityForm<T>,
  ) {
    if (form.entity.isNew) {
      return;
    }

    const collectingFields = form.fieldConfigs.filter(
      isCollectingFromLinkedRecords,
    );
    await Promise.all(
      collectingFields.map(async (field) =>
        form.inheritedParentValues.set(
          field.id,
          await this.automatedFieldUpdateConfigService
            .collectValuesOfLinkedRecords(
              form.entity,
              field.defaultValue.config,
            )
            .catch((error) =>
              Logging.warn(
                "InheritedValueService could not load linked records for collected field",
                { field: field.id },
                error,
              ),
            ),
        ),
      ),
    );
  }

  /**
   * Set up the inheritance value for a field, triggering an initial inheritance
   * and watching future changes of the source (parent) field for automatic updates.
   * @param targetFormControl
   * @param fieldConfig
   * @param form
   */
  override async setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
    form: EntityForm<any>,
  ) {
    const config: DefaultValueConfigInheritedField =
      fieldConfig.defaultValue?.config;
    if (!config) {
      return;
    }

    // Only handle inheritance configs (not automation configs)
    // Inheritance has sourceReferenceField but NO sourceReferenceEntity
    if (!config.sourceReferenceField || config.sourceReferenceEntity) {
      return;
    }

    // load inherited from initial entity
    await this.onSourceValueChange(
      form,
      targetFormControl,
      fieldConfig,
      this.getParentRefIds(form, config),
    );

    // subscribe to update inherited whenever source field changes
    let sourceFormControl: AbstractControl<any, any> | null =
      form.formGroup.get(config.sourceReferenceField);
    if (sourceFormControl && targetFormControl) {
      form.watcher.set(
        "sourceFormControlValueChanges_" + config.sourceReferenceField,
        sourceFormControl.valueChanges.subscribe(
          async (change) =>
            await this.onSourceValueChange(
              form,
              targetFormControl,
              fieldConfig,
              change,
            ),
        ),
      );
    }
  }

  /**
   * Update the inherited (target field) value based on the change of the source field (parent reference) change.
   * @param form
   * @param targetFormControl
   * @param fieldConfig
   * @param change The new entity ID value(s) of the source (parent ref) field.
   * @private
   */
  private async onSourceValueChange(
    form: EntityForm<any>,
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
    change,
  ) {
    const defaultConfig: DefaultValueConfigInheritedField =
      fieldConfig.defaultValue?.config;
    if (
      !defaultConfig ||
      form.formGroup.disabled ||
      !form.entity.isNew ||
      (targetFormControl.dirty && !!targetFormControl.value)
    ) {
      return;
    }

    const parentIds = asArray(change ?? []).filter((id) => !!id);
    if (parentIds.length === 0) {
      targetFormControl.setValue(undefined);
      return;
    }

    const parentEntities = await Promise.all(
      parentIds.map((id) => this.loadEntity(id)),
    );
    // without all linked parents available, no shared value can be determined
    const sourceValue = parentEntities.every((parent) => !!parent)
      ? getCommonValue(
          parentEntities.map(
            (parent) => parent[defaultConfig.sourceValueField],
          ),
        )
      : undefined;

    if (sourceValue === undefined) {
      targetFormControl.setValue(undefined);
      return;
    }

    if (fieldConfig.isArray) {
      // always wrap the source value in an array
      const targetValue = Array.isArray(sourceValue)
        ? [...sourceValue]
        : [sourceValue];
      targetFormControl.setValue(targetValue);
    } else {
      targetFormControl.setValue(sourceValue);
    }

    targetFormControl.markAsUntouched();
    targetFormControl.markAsPristine();
  }

  override async onFormValueChanges<T extends Entity>(form: EntityForm<T>) {
    await this.updateLinkedEntities(form);
  }

  /**
   * Get details about the status and context of an inherited value field
   * to display to the user.
   * @param form
   * @param field
   */
  override getDefaultValueUiHint<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
  ): DefaultValueHint | undefined {
    const defaultConfig: DefaultValueConfigInheritedField =
      field?.defaultValue?.config;
    if (!defaultConfig) {
      return;
    }

    if (isCollectingFromLinkedRecords(field)) {
      return this.getCollectedValuesUiHint(form, field, defaultConfig);
    }

    // Only show the inheritance UI hint for actual inheritance configs (not automation)
    // Inheritance has sourceReferenceField but NO sourceReferenceEntity
    if (
      !defaultConfig.sourceReferenceField ||
      defaultConfig.sourceReferenceEntity
    ) {
      return;
    }

    const parentRefIds = this.getParentRefIds(form, defaultConfig);
    if (
      parentRefIds.length === 0 ||
      (parentRefIds.length > 1 &&
        form.inheritedParentValues.get(field.id) === undefined)
    ) {
      // nothing to inherit, e.g. no or only differing values in the linked parents
      return {
        inheritedFromField: defaultConfig.sourceReferenceField,
        isEmpty: true,
      };
    }

    return {
      inheritedFromField: defaultConfig.sourceReferenceField,
      inheritedFromType: Entity.extractTypeFromId(parentRefIds[0]),
      isInSync:
        JSON.stringify(form.inheritedParentValues.get(field.id)) ===
        JSON.stringify(this.getCurrentDatabaseValue(form, field)),
      syncFromParentField: () =>
        this.setDatabaseValueToForm(
          form,
          field,
          form.inheritedParentValues.get(field.id),
        ),
    };
  }

  /**
   * Hint for a field collecting the values of all records that link to this entity.
   * No hint is shown as long as there are no values of linked records to sync from.
   */
  private getCollectedValuesUiHint<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
    config: DefaultValueConfigInheritedField,
  ): DefaultValueHint | undefined {
    const collectedValues: any[] = form.inheritedParentValues.get(field.id);
    if (!collectedValues?.length) {
      return;
    }

    return {
      inheritedFromField: config.sourceReferenceField,
      inheritedFromType: config.sourceReferenceEntity,
      isCollectedFromLinkedRecords: true,
      // the order of values does not matter here
      isInSync:
        xorWith(
          collectedValues,
          asArray(this.getCurrentDatabaseValue(form, field) ?? []),
          isEqual,
        ).length === 0,
      syncFromParentField: () =>
        this.setDatabaseValueToForm(form, field, collectedValues),
    };
  }

  private getCurrentDatabaseValue<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
  ) {
    return this.automatedFieldUpdateConfigService.transformSourceValueToDatabaseFormat(
      form.formGroup.get(field.id)?.value,
      form.entity,
      field.id,
      this.entitySchemaService,
    );
  }

  private setDatabaseValueToForm<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
    databaseValue: any,
  ) {
    form.formGroup
      .get(field.id)
      .setValue(
        this.entitySchemaService.valueToEntityFormat(databaseValue, field),
      );
  }

  private async updateLinkedEntities<T extends Entity>(form: EntityForm<T>) {
    let inheritedConfigs: Map<string, DefaultValueConfigInheritedField> =
      getConfigsForInheritedMode(form.fieldConfigs);

    const linkedEntityRefs: Map<string, string[]> = this.getLinkedEntityRefs(
      inheritedConfigs,
      form,
    );

    for (const [fieldId, parentEntityIds] of linkedEntityRefs) {
      const parentEntities = await Promise.all(
        parentEntityIds.map((id) => this.loadEntity(id)),
      );

      form.inheritedParentValues.set(
        fieldId,
        parentEntities.every((parent) => !!parent)
          ? this.automatedFieldUpdateConfigService.calculateCommonValue(
              parentEntities,
              inheritedConfigs.get(fieldId),
            )
          : undefined,
      );
    }
  }

  /**
   * Get the linked entity references from the form.
   * @param inheritedConfigs
   * @param form
   * @return Entity ids of the linked parent entities (always wrapped as an array)
   * @private
   */
  private getLinkedEntityRefs<T extends Entity>(
    inheritedConfigs: Map<string, DefaultValueConfigInheritedField>,
    form: EntityForm<T>,
  ): Map<string, string[]> {
    const linkedEntityRefs: Map<string, string[]> = new Map();

    for (const [key, defaultValueConfig] of inheritedConfigs) {
      const parentRefIds = this.getParentRefIds(form, defaultValueConfig);
      if (parentRefIds.length > 0) {
        linkedEntityRefs.set(key, parentRefIds);
      }
    }

    return linkedEntityRefs;
  }

  /**
   * Get the ids of the linked parent entities from the form or entity.
   * @param form
   * @param defaultConfig
   * @return the ids of all linked parent entities (empty if none are linked)
   * @private
   */
  private getParentRefIds<T extends Entity>(
    form: EntityForm<T>,
    defaultConfig: DefaultValueConfigInheritedField,
  ): string[] {
    const linkedFieldValue =
      form.formGroup?.get(defaultConfig.sourceReferenceField)?.value ??
      form.entity?.[defaultConfig.sourceReferenceField];

    return asArray(linkedFieldValue ?? []).filter((id) => !!id);
  }

  private async loadEntity(entityId: string): Promise<Entity | undefined> {
    try {
      return await this.entityMapper.load(
        Entity.extractTypeFromId(entityId),
        entityId,
      );
    } catch (error) {
      const status = error?.["status"] ?? error?.["statusCode"];
      if (status === 401 || status === 403) {
        // the user simply has no read access to the linked entity - expected for some roles
        Logging.debug(
          "InheritedValueService could not load source entity for inherited field (no permission)",
          { entityId },
          error,
        );
      } else {
        Logging.warn(
          "InheritedValueService could not load source entity for inherited field",
          { entityId },
          error,
        );
      }
      return undefined;
    }
  }
}

/**
 * Get the default value configs filtered for the given mode,
 * excluding automation rules (with sourceReferenceEntity), which are handled by the AutomatedFieldUpdateConfigService.
 * @param fieldConfigs
 */
export function getConfigsForInheritedMode(
  fieldConfigs: FormFieldConfig[],
): Map<string, DefaultValueConfigInheritedField> {
  return new Map(
    fieldConfigs
      .filter(
        (field) =>
          field.defaultValue?.mode === "inherited-field" &&
          !field.defaultValue.config?.sourceReferenceEntity,
      )
      .map((field) => [field.id, field.defaultValue.config]),
  );
}
