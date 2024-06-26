import { Injectable } from "@angular/core";
import { AbstractControl, FormGroup } from "@angular/forms";
import { PLACEHOLDERS } from "../schema/entity-schema-field";
import { DefaultValueConfig } from "../schema/default-value-config";
import { Entity } from "../model/entity";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { LoggingService } from "../../logging/logging.service";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { ExtendedEntityForm } from "../../common-components/entity-form/entity-form.service";
import { EntitySchema } from "../schema/entity-schema";

/**
 * When edit an Entity, apply this business logic for DefaultValueConfig
 */
@Injectable({
  providedIn: "root",
})
export class HandleDefaultValuesUseCase {
  constructor(
    private entityMapper: EntityMapperService,
    private currentUser: CurrentUserSubject,
    private logger: LoggingService,
  ) {}

  async handleExtendedEntityForm<T extends Entity>(
    form: ExtendedEntityForm<T>,
    entitySchema: EntitySchema,
    isNew: boolean,
  ): Promise<void> {
    let inheritedConfigs: Map<string, DefaultValueConfig> =
      this.getConfigsByMode(form.defaultValueConfigs, ["inherited"]);

    const linkedEntityRefs: Map<string, string[]> = this.getLinkedEntityRefs(
      inheritedConfigs,
      form,
    );

    await this.loadLinkedEntitiesIntoForm(
      Array.from(linkedEntityRefs.values()).flat(),
      form,
    );

    this.enableChangeListener(form);

    for (const [key, entitySchemaField] of entitySchema) {
      switch (entitySchemaField.defaultValue?.mode) {
        case "inherited":
          return this.handleInheritedMode(
            form.formGroup,
            key,
            entitySchemaField.defaultValue,
            isNew,
            entitySchema.get(key).isArray,
          );
        case "static":
          return this.handleStaticMode(
            form.formGroup,
            key,
            entitySchemaField.defaultValue,
            isNew,
            entitySchema.get(key).isArray,
          );
        case "dynamic":
          return this.handleDynamicMode(
            form.formGroup,
            key,
            entitySchemaField.defaultValue,
            isNew,
            entitySchema.get(key).isArray,
          );
      }
    }
  }

  private getLinkedEntityRefs<T extends Entity>(
    inheritedConfigs: Map<string, DefaultValueConfig>,
    form: ExtendedEntityForm<T>,
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
    form: ExtendedEntityForm<T>,
  ): Promise<void> {
    for (const entityRef of entityRefs) {
      let parentEntity: Entity = await this.entityMapper.load(
        Entity.extractTypeFromId(entityRef),
        entityRef,
      );
      form.inheritedParentValues.set(entityRef, parentEntity);
    }
  }

  private getConfigsByMode(
    defaultValueConfigs: Map<string, DefaultValueConfig>,
    mode: ("inherited" | "static" | "dynamic")[],
  ): Map<string, DefaultValueConfig> {
    let configs: Map<string, DefaultValueConfig> = new Map();

    for (const [key, defaultValueConfig] of defaultValueConfigs) {
      if (mode.indexOf(defaultValueConfig.mode) !== -1) {
        configs.set(key, defaultValueConfig);
      }
    }

    return configs;
  }

  private handleInheritedMode(
    formGroup: FormGroup,
    fieldName: string,
    defaultValueConfig: DefaultValueConfig,
    isNew: boolean,
    isArray: boolean,
  ) {
    let sourceFormControl: AbstractControl<any, any> | null = formGroup.get(
      defaultValueConfig.localAttribute,
    );

    let targetFormControl: AbstractControl<any, any> | null =
      formGroup.get(fieldName);

    if (!sourceFormControl || !targetFormControl) {
      return;
    }

    sourceFormControl.valueChanges.subscribe(async (change) => {
      if (formGroup.disabled) {
        return;
      }

      if (targetFormControl.dirty && !!targetFormControl.value && isNew) {
        return;
      }

      if (!isNew) {
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

      if (!parentEntity || !parentEntity[defaultValueConfig.field]) {
        return;
      }

      if (isArray) {
        targetFormControl.setValue([...parentEntity[defaultValueConfig.field]]);
      } else {
        targetFormControl.setValue(parentEntity[defaultValueConfig.field]);
      }

      targetFormControl.markAsUntouched();
      targetFormControl.markAsPristine();
    });
  }

  private handleStaticMode(
    formGroup: FormGroup,
    fieldName: string,
    defaultValueConfig: DefaultValueConfig,
    isNew: boolean,
    isArray: boolean,
  ) {
    let targetFormControl = formGroup.get(fieldName);

    if (!this.preConditionsFulfilled(isNew, targetFormControl, isArray)) {
      return;
    }

    if (isArray) {
      targetFormControl.setValue([defaultValueConfig.value]);
    } else {
      targetFormControl.setValue(defaultValueConfig.value);
    }
  }

  private handleDynamicMode(
    formGroup: FormGroup,
    fieldName: string,
    defaultValueConfig: DefaultValueConfig,
    isNew: boolean,
    isArray: boolean,
  ) {
    let targetFormControl = formGroup.get(fieldName);

    if (!this.preConditionsFulfilled(isNew, targetFormControl, isArray)) {
      return;
    }

    switch (defaultValueConfig.value) {
      case PLACEHOLDERS.NOW:
        let now = new Date();
        if (isArray) {
          targetFormControl.setValue([now]);
        } else {
          targetFormControl.setValue(now);
        }
        break;
      case PLACEHOLDERS.CURRENT_USER:
        let userId = this.currentUser.value?.getId();
        if (!userId) {
          break;
        }

        if (isArray) {
          targetFormControl.setValue([userId]);
        } else {
          targetFormControl.setValue(userId);
        }
        break;
      default:
        this.logger.warn(
          "Unknown PLACEHOLDERS value used in fieldValueConfig: " +
            defaultValueConfig,
        );
        break;
    }
  }

  private preConditionsFulfilled(
    isNew: boolean,
    formControl: AbstractControl,
    isArray: boolean,
  ): boolean {
    if (!isNew) {
      return false;
    }

    if (!formControl) {
      return false;
    }

    if (!isArray && !!formControl.value) {
      return false;
    }

    if (isArray && formControl.value && formControl.value.length > 0) {
      return false;
    }

    return true;
  }

  private enableChangeListener<T extends Entity>(form: ExtendedEntityForm<T>) {
    form.watcher.set(
      "formGroupValueChanges",
      form.formGroup.valueChanges.subscribe(async (change) => {
        await this.updateLinkedEntities(form);
        this.syncCheck(form);
      }),
    );
  }

  private async updateLinkedEntities<T extends Entity>(
    form: ExtendedEntityForm<T>,
  ) {
    let inheritedConfigs: Map<string, DefaultValueConfig> =
      this.getConfigsByMode(form.defaultValueConfigs, ["inherited"]);

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

      form.inheritedParentValues.set(key, parentEntity[key]);
    }
  }

  private syncCheck<T extends Entity>(form: ExtendedEntityForm<T>) {
    let inheritedConfigs: Map<string, DefaultValueConfig> =
      this.getConfigsByMode(form.defaultValueConfigs, ["inherited"]);

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
}
