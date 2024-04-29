import { Injectable } from "@angular/core";
import { AbstractControl, FormGroup } from "@angular/forms";
import { EntitySchemaField, PLACEHOLDERS } from "../schema/entity-schema-field";
import { DefaultFieldValueConfig } from "../schema/default-field-value-config";
import { Entity } from "../model/entity";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { LoggingService } from "../../logging/logging.service";
import { CurrentUserSubject } from "../../session/current-user-subject";

/**
 * When edit an Entity, apply this business logic for DefaultFieldValueConfig
 */
@Injectable({
  providedIn: "root",
})
export class HandleDefaultFieldValuesUseCase {
  constructor(
    private entityMapper: EntityMapperService,
    private currentUser: CurrentUserSubject,
    private logger: LoggingService,
  ) {}

  handleFormGroup(
    formGroup: FormGroup,
    fieldConfigs: [string, EntitySchemaField][],
    isNew: boolean,
  ) {
    fieldConfigs.forEach(([fieldName, fieldSchema]) => {
      let defaultFieldValueConfig = fieldSchema.defaultFieldValue;

      switch (defaultFieldValueConfig.mode) {
        case "inherited":
          return this.handleInheritedMode(
            formGroup,
            fieldName,
            defaultFieldValueConfig,
            isNew,
          );
        case "static":
          return this.handleStaticMode(
            formGroup,
            fieldName,
            defaultFieldValueConfig,
            isNew,
          );
        case "dynamic":
          return this.handleDynamicMode(
            formGroup,
            fieldName,
            defaultFieldValueConfig,
            isNew,
          );
      }
    });
  }

  private handleInheritedMode(
    formGroup: FormGroup,
    fieldName: string,
    defaultFieldValueConfig: DefaultFieldValueConfig,
    isNew: boolean,
  ) {
    let sourceFormControl: AbstractControl<any, any> | null = formGroup.get(
      defaultFieldValueConfig.localAttribute,
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

      let parentEntity: Entity = await this.entityMapper.load(
        Entity.extractTypeFromId(change),
        change,
      );

      if (!parentEntity || !parentEntity[defaultFieldValueConfig.field]) {
        return;
      }

      targetFormControl.setValue(parentEntity[defaultFieldValueConfig.field]);
      targetFormControl.markAsUntouched();
      targetFormControl.markAsPristine();
    });
  }

  private handleStaticMode(
    formGroup: FormGroup,
    fieldName: string,
    defaultFieldValueConfig: DefaultFieldValueConfig,
    isNew: boolean,
  ) {
    if (!isNew) {
      return;
    }

    let targetFormControl = formGroup.get(fieldName);

    if (!targetFormControl) {
      return;
    }

    if (!!targetFormControl.value) {
      return;
    }

    targetFormControl.setValue(defaultFieldValueConfig.value);
  }

  private handleDynamicMode(
    formGroup: FormGroup,
    fieldName: string,
    defaultFieldValueConfig: DefaultFieldValueConfig,
    isNew: boolean,
  ) {
    if (!isNew) {
      return;
    }

    let targetFormControl = formGroup.get(fieldName);

    if (!targetFormControl) {
      return;
    }

    if (!!targetFormControl.value) {
      return;
    }

    switch (defaultFieldValueConfig.value) {
      case PLACEHOLDERS.NOW:
        targetFormControl.setValue(new Date());
        break;
      case PLACEHOLDERS.CURRENT_USER:
        targetFormControl.setValue(this.currentUser.value?.getId());
        break;
      default:
        this.logger.warn(
          "Unknown PLACEHOLDERS value used in fieldValueConfig: " +
            defaultFieldValueConfig,
        );
        break;
    }
  }
}
