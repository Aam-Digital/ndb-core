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

  async initEntityForm<T extends Entity>(form: EntityForm<T>) {
    let inheritedConfigs: Map<string, DefaultValueConfig> = getConfigsByMode(
      form.defaultValueConfigs,
      ["inherited"],
    );

    const linkedEntityRefs: Map<string, string[]> = this.getLinkedEntityRefs(
      inheritedConfigs,
      form,
    );
    await this.loadLinkedEntitiesIntoForm(
      Array.from(linkedEntityRefs.values()).flat(),
      form,
    );
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
          return;
        }
      }

      let parentEntity: Entity = await this.entityMapper.load(
        Entity.extractTypeFromId(change),
        change,
      );

      if (!parentEntity || !parentEntity[fieldConfig.defaultValue.field]) {
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
    });
  }

  private getLinkedEntityRefs<T extends Entity>(
    inheritedConfigs: Map<string, DefaultValueConfig>,
    form: EntityForm<T>,
  ): Map<string, string[]> {
    const linkedEntityRefs: Map<string, string[]> = new Map();

    for (const [key, defaultValueConfig] of inheritedConfigs) {
      let linkedEntities: string[] = form.formGroup.get(
        defaultValueConfig.localAttribute,
      )?.value;

      if (linkedEntities == null || linkedEntities.length == 0) {
        continue;
      }

      linkedEntityRefs.set(key, linkedEntities);
    }

    return linkedEntityRefs;
  }

  private async loadLinkedEntitiesIntoForm<T extends Entity>(
    entityRefs: string[],
    form: EntityForm<T>,
  ): Promise<void> {
    for (const entityRef of entityRefs) {
      let parentEntity: Entity = await this.entityMapper.load(
        Entity.extractTypeFromId(entityRef),
        entityRef,
      );
      form.inheritedParentValues.set(entityRef, parentEntity);
    }
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
      if (value.length !== 1) {
        form.inheritedParentValues.delete(key);
        continue;
      }

      let parentEntity: Entity = await this.entityMapper.load(
        Entity.extractTypeFromId(value[0]),
        value[0],
      );

      form.inheritedParentValues.set(
        key,
        parentEntity[inheritedConfigs.get(key).field],
      );
    }
  }

  private syncCheck<T extends Entity>(form: EntityForm<T>) {
    let inheritedConfigs: Map<string, DefaultValueConfig> = getConfigsByMode(
      form.defaultValueConfigs,
      ["inherited"],
    );

    const linkedEntityRefs: Map<string, string[]> = this.getLinkedEntityRefs(
      inheritedConfigs,
      form,
    );

    for (let [key, value] of linkedEntityRefs) {
      form.inheritedSyncStatus.set(
        key,
        JSON.stringify(form.inheritedParentValues.get(key)) ===
          JSON.stringify(form.formGroup.get(key)?.value),
      );
    }
  }

  async onFormValueChanges<T extends Entity>(form: EntityForm<T>) {
    await this.updateLinkedEntities(form);
    this.syncCheck(form);
  }
}
