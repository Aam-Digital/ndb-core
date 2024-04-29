import { Injectable } from "@angular/core";
import { EntitySchemaField, PLACEHOLDERS } from "./schema/entity-schema-field";
import { isArrayDataType } from "../basic-datatypes/datatype-utils";
import { CurrentUserSubject } from "../session/current-user-subject";
import { Entity } from "./model/entity";
import { AbstractControl, FormGroup } from "@angular/forms";
import { HandleDefaultFieldValuesUseCase } from "./default-field-value/handle-default-field-values.usecase";

@Injectable({
  providedIn: "root",
})
export class DefaultFieldValueService {
  constructor(
    private currentUser: CurrentUserSubject,
    private handleDefaultFieldValuesUseCase: HandleDefaultFieldValuesUseCase,
  ) {}

  handle(formGroup: FormGroup, entity: Entity): void {
    let schema = entity.getSchema();

    // can be removed, if all configs are adapted
    let legacyDefaultValueConfigs = Array.from(schema.entries()).filter(
      ([key, fieldSchema]) => {
        return !!fieldSchema.defaultValue;
      },
    );

    let defaultValueConfigs = Array.from(schema.entries()).filter(
      ([key, fieldSchema]) => {
        return fieldSchema.defaultFieldValue;
      },
    );

    let inheritedConfigs = defaultValueConfigs.filter(
      ([key, fieldSchema]) => fieldSchema.defaultFieldValue.mode == "inherited",
    );

    let nonInheritedConfigs = defaultValueConfigs.filter(
      ([key, fieldSchema]) => fieldSchema.defaultFieldValue.mode != "inherited",
    );

    if (inheritedConfigs.length > 0) {
      // apply inherited rules first, to be sure, that default values are reflected correctly
      this.handleDefaultFieldValuesUseCase.handleFormGroup(
        formGroup,
        inheritedConfigs,
      );
    }

    if (nonInheritedConfigs.length > 0) {
      this.handleDefaultFieldValuesUseCase.handleFormGroup(
        formGroup,
        nonInheritedConfigs,
      );
    }

    // can be removed, if all configs are adapted
    if (entity.isNew) {
      this.applyLegacyConfigs(formGroup, legacyDefaultValueConfigs);
    }
  }

  // can be removed, if all configs are adapted
  private applyLegacyConfigs(
    formGroup: FormGroup,
    legacyDefaultValueConfigs: [string, EntitySchemaField][],
  ) {
    legacyDefaultValueConfigs.forEach(([key, fieldSchema]) => {
      let defaultValue = this.getLegacyDefaultValue(fieldSchema);
      let targetControl = formGroup.get(key);
      if (defaultValue && !!targetControl && this.isEmpty(targetControl)) {
        targetControl.setValue(defaultValue);
      }
    });
  }

  // can be removed, if all configs are adapted
  private getLegacyDefaultValue(schema: EntitySchemaField): any {
    let newVal: any;
    switch (schema.defaultValue) {
      case PLACEHOLDERS.NOW:
        newVal = new Date();
        break;
      case PLACEHOLDERS.CURRENT_USER:
        newVal = this.currentUser.value?.getId();
        break;
      case undefined:
      case null:
        break;
      default:
        newVal = schema.defaultValue;
    }
    if (newVal && isArrayDataType(schema.dataType)) {
      newVal = [newVal];
    }
    return newVal;
  }

  private isEmpty(targetControl: AbstractControl) {
    return (
      targetControl.value == "" ||
      targetControl.value == null ||
      JSON.stringify(targetControl.value) == "{}"
    );
  }
}
