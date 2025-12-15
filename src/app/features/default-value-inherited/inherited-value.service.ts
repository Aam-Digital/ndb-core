import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { Entity } from "../../core/entity/model/entity";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../../core/default-values/default-value-strategy.interface";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { DefaultValueMode } from "../../core/default-values/default-value-config";
import { DefaultValueHint } from "../../core/default-values/default-value-service/default-value.service";
import { asArray } from "../../utils/asArray";
import { FormFieldConfig } from "../../core/common-components/entity-form/FormConfig";
import { DefaultValueConfigInheritedField } from "../inherited-field/inherited-field-config";

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

  private entityMapper = inject(EntityMapperService);

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component =
      await import("../inherited-field/admin-inherited-field/admin-inherited-field.component").then(
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
    // Inheritance has sourceReferenceField but NO sourceEntityType
    if (!config.sourceReferenceField || config.sourceEntityType) {
      return;
    }

    // load inherited from initial entity
    await this.onSourceValueChange(
      form,
      targetFormControl,
      fieldConfig,
      this.getParentRefId(form, config),
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
   * @param change The new entity ID value of the source (parent ref) field.
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
    if (!defaultConfig) {
      return;
    }

    if (form.formGroup.disabled) {
      return;
    }

    if (
      targetFormControl.dirty &&
      !!targetFormControl.value &&
      form.entity.isNew
    ) {
      return;
    }

    if (!form.entity.isNew) {
      return;
    }

    if (!change || "") {
      targetFormControl.setValue(undefined);
      return;
    }

    // source field is array, use first element if only one element
    if (Array.isArray(change)) {
      if (change.length === 1) {
        change = change[0];
      } else {
        targetFormControl.setValue(undefined);
        return;
      }
    }

    let parentEntity: Entity = await this.entityMapper.load(
      Entity.extractTypeFromId(change),
      change,
    );

    if (
      !parentEntity ||
      parentEntity[defaultConfig.sourceValueField] === undefined
    ) {
      return;
    }

    let sourceValue = parentEntity[defaultConfig.sourceValueField];

    // todo: handle mapping of values for test cases, need to update later
    if (defaultConfig.valueMapping && sourceValue !== undefined) {
      const mappedValue = defaultConfig.valueMapping[sourceValue];
      if (mappedValue !== undefined) {
        sourceValue = mappedValue;
      }
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

    // Only show the inheritance UI hint for actual inheritance configs (not automation)
    // Inheritance has sourceReferenceField but NO sourceEntityType
    if (!defaultConfig.sourceReferenceField || defaultConfig.sourceEntityType) {
      return;
    }

    const parentRefValue = this.getParentRefId(form, defaultConfig);
    if (!parentRefValue) {
      return {
        inheritedFromField: defaultConfig.sourceReferenceField,
        isEmpty: true,
      };
    }

    return {
      inheritedFromField: defaultConfig.sourceReferenceField,
      inheritedFromType: parentRefValue
        ? Entity.extractTypeFromId(parentRefValue)
        : undefined,
      isInSync:
        JSON.stringify(form.inheritedParentValues.get(field.id)) ===
        JSON.stringify(form.formGroup.get(field.id)?.value),
      syncFromParentField: () => {
        form.formGroup
          .get(field.id)
          .setValue(form.inheritedParentValues.get(field.id));
      },
    };
  }

  private async updateLinkedEntities<T extends Entity>(form: EntityForm<T>) {
    let inheritedConfigs: Map<string, DefaultValueConfigInheritedField> =
      getConfigsForInheritedMode(form.fieldConfigs);

    const linkedEntityRefs: Map<string, string[]> = this.getLinkedEntityRefs(
      inheritedConfigs,
      form,
    );

    for (let [fieldId, parentEntityIds] of linkedEntityRefs) {
      if (parentEntityIds.length > 1) {
        // multi-inheritance not supported (yet) -> keep values in form and stop inheritance
        form.inheritedParentValues.delete(fieldId);
        continue;
      }

      let parentEntity: Entity;
      if (parentEntityIds.length === 1) {
        parentEntity = await this.entityMapper.load(
          Entity.extractTypeFromId(parentEntityIds[0]),
          parentEntityIds[0],
        );
      }

      // if value empty -> set inherited values to undefined
      form.inheritedParentValues.set(
        fieldId,
        parentEntity?.[inheritedConfigs.get(fieldId).sourceValueField],
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
      let linkedEntities: null | string | string[] = this.getParentRefId(
        form,
        defaultValueConfig,
        false,
      );

      if (linkedEntities == null || linkedEntities.length == 0) {
        continue;
      }

      linkedEntityRefs.set(key, asArray(linkedEntities));
    }

    return linkedEntityRefs;
  }

  /**
   * Get the parent reference id from the form or entity.
   * @param form
   * @param defaultConfig
   * @param castToSingle Whether for arrays of IDs, this should be cast to a single ID only.
   * @private
   */
  private getParentRefId<T extends Entity>(
    form: EntityForm<T>,
    defaultConfig: DefaultValueConfigInheritedField,
    castToSingle = true,
  ): string | undefined {
    const linkedFieldValue =
      form.formGroup?.get(defaultConfig.sourceReferenceField)?.value ??
      form.entity?.[defaultConfig.sourceReferenceField];

    if (!castToSingle) {
      return linkedFieldValue;
    }

    if (Array.isArray(linkedFieldValue)) {
      // inheritance is only supported for a single parent reference
      return linkedFieldValue?.length === 1 ? linkedFieldValue[0] : undefined;
    } else {
      return linkedFieldValue;
    }
  }
}

/**
 * Get the default value configs filtered for the given mode.
 * @param fieldConfigs
 */
export function getConfigsForInheritedMode(
  fieldConfigs: FormFieldConfig[],
): Map<string, DefaultValueConfigInheritedField> {
  const mode: DefaultValueMode[] = ["inherited-field"];

  let configs: Map<string, DefaultValueConfigInheritedField> = new Map();

  for (const field of fieldConfigs) {
    if (mode.includes(field.defaultValue?.mode)) {
      configs.set(field.id, field.defaultValue?.config);
    }
  }

  return configs;
}
