import { Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntityForm } from "../common-components/entity-form/entity-form.service";
import { Entity } from "../entity/model/entity";
import {
  DefaultValueStrategy,
  getConfigsByMode,
} from "./default-value-strategy.interface";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { DefaultValueConfig } from "../entity/schema/default-value-config";
import { DefaultValueHint } from "./default-value.service";
import { asArray } from "../../utils/utils";

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
  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  override async initEntityForm<T extends Entity>(form: EntityForm<T>) {
    await this.updateLinkedEntities(form);
  }

  setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
    form: EntityForm<any>,
  ) {
    let sourceFormControl: AbstractControl<any, any> | null =
      form.formGroup.get(fieldConfig.defaultValue.localAttribute);

    if (!sourceFormControl || !targetFormControl) {
      return;
    }

    form.watcher.set(
      "sourceFormControlValueChanges_" +
        fieldConfig.defaultValue.localAttribute,
      sourceFormControl.valueChanges.subscribe(async (change) => {
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
          parentEntity[fieldConfig.defaultValue.field] === undefined
        ) {
          return;
        }

        if (fieldConfig.isArray) {
          targetFormControl.setValue([
            ...parentEntity[fieldConfig.defaultValue.field],
          ]);
        } else {
          targetFormControl.setValue(
            parentEntity[fieldConfig.defaultValue.field],
          );
        }

        targetFormControl.markAsUntouched();
        targetFormControl.markAsPristine();
      }),
    );
  }

  override async onFormValueChanges<T extends Entity>(form: EntityForm<T>) {
    await this.updateLinkedEntities(form);
  }

  getDefaultValueUiHint<T extends Entity>(
    form: EntityForm<T>,
    fieldId: string,
  ): DefaultValueHint | undefined {
    const defaultConfig = form?.defaultValueConfigs?.get(fieldId);
    if (!defaultConfig) {
      return;
    }

    const parentRefValue = this.getParentRefFromForm(form, defaultConfig);
    if (!parentRefValue) {
      return {
        inheritedFromField: defaultConfig.localAttribute,
        isEmpty: true,
      };
    }

    return {
      inheritedFromField: defaultConfig.localAttribute,
      inheritedFromType: parentRefValue
        ? Entity.extractTypeFromId(parentRefValue)
        : undefined,
      isInSync:
        JSON.stringify(form.inheritedParentValues.get(fieldId)) ===
        JSON.stringify(form.formGroup.get(fieldId)?.value),
      syncFromParentField: () => {
        form.formGroup
          .get(fieldId)
          .setValue(form.inheritedParentValues.get(fieldId));
      },
    };
  }

  private async updateLinkedEntities<T extends Entity>(form: EntityForm<T>) {
    let inheritedConfigs: Map<string, DefaultValueConfig> = getConfigsByMode(
      form.defaultValueConfigs,
      ["inherited"],
    );

    const linkedEntityRefs: Map<string, string[]> = this.getLinkedEntityRefs(
      inheritedConfigs,
      form,
    );

    for (let [key, value] of linkedEntityRefs) {
      if (value.length > 1) {
        // multi-inheritance not supported (yet) -> keep values in form and stop inheritance
        form.inheritedParentValues.delete(key);
        continue;
      }

      let parentEntity: Entity;
      if (value.length === 1) {
        parentEntity = await this.entityMapper.load(
          Entity.extractTypeFromId(value[0]),
          value[0],
        );
      }

      // if value empty -> set inherited values to undefined
      form.inheritedParentValues.set(
        key,
        parentEntity?.[inheritedConfigs.get(key).field],
      );
    }
  }

  private getLinkedEntityRefs<T extends Entity>(
    inheritedConfigs: Map<string, DefaultValueConfig>,
    form: EntityForm<T>,
  ): Map<string, string[]> {
    const linkedEntityRefs: Map<string, string[]> = new Map();

    for (const [key, defaultValueConfig] of inheritedConfigs) {
      let linkedEntities: null | string | string[] = form.formGroup.get(
        defaultValueConfig.localAttribute,
      )?.value;

      if (linkedEntities == null || linkedEntities.length == 0) {
        continue;
      }

      linkedEntityRefs.set(key, asArray(linkedEntities));
    }

    return linkedEntityRefs;
  }

  private getParentRefFromForm<T extends Entity>(
    form: EntityForm<T>,
    defaultConfig: DefaultValueConfig,
  ): string | undefined {
    const linkedFieldValue = form.formGroup?.get(
      defaultConfig.localAttribute,
    )?.value;

    if (Array.isArray(linkedFieldValue)) {
      // inheritance is only supported for a single parent reference
      return linkedFieldValue?.length === 1 ? linkedFieldValue[0] : undefined;
    } else {
      return linkedFieldValue;
    }
  }
}
