import { Injectable } from "@angular/core";
import { AbstractControl, FormGroup } from "@angular/forms";
import { EntitySchemaField, PLACEHOLDERS } from "../schema/entity-schema-field";
import { DefaultValueConfig } from "../schema/default-value-config";
import { Entity } from "../model/entity";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Logging } from "../../logging/logging.service";
import { CurrentUserSubject } from "../../session/current-user-subject";

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
  ) {}

  handleFormGroup(
    formGroup: FormGroup,
    fieldConfigs: [string, EntitySchemaField][],
    isNew: boolean,
  ) {
    fieldConfigs.forEach(([fieldName, fieldSchema]) => {
      let defaultValueConfig = fieldSchema.defaultValue;

      switch (defaultValueConfig.mode) {
        case "inherited":
          return this.handleInheritedMode(
            formGroup,
            fieldName,
            defaultValueConfig,
            isNew,
            fieldSchema.isArray,
          );
        case "static":
          return this.handleStaticMode(
            formGroup,
            fieldName,
            defaultValueConfig,
            isNew,
            fieldSchema.isArray,
          );
        case "dynamic":
          return this.handleDynamicMode(
            formGroup,
            fieldName,
            defaultValueConfig,
            isNew,
            fieldSchema.isArray,
          );
      }
    });
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
        Logging.warn(
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
}
