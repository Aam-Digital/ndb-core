import { inject, Injectable } from "@angular/core";
import { AsyncPromiseValidatorFn } from "../../common-components/entity-form/dynamic-form-validators/validator-types";
import { WithinParentConfig } from "../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { getCurrentRecordOfControl } from "../../common-components/entity-form/current-record-state";
import {
  FieldValidator,
  ValidatorContext,
} from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DateRangeDatatype } from "./date-range.datatype";
import {
  findParentOutside,
  getParentIds,
  loadParentRanges,
} from "./parent-ranges";

/**
 * Validator for a date range that should lie within the range of the parent record(s) it links to.
 * Its error is only a warning (`warning: true`): the record can still be saved after confirming it.
 * The parent link is taken from the form, or from the saved record if the form has no field for it.
 */
export function withinParentValidator(
  config: WithinParentConfig,
  fieldId: string,
  record: Entity | undefined,
  entityMapper: EntityMapperService,
): AsyncPromiseValidatorFn {
  return async (control) => {
    const parentIds = getParentIds(
      config,
      getCurrentRecordOfControl(control, record),
    );
    if (!parentIds.length) {
      return null;
    }

    const parents = await loadParentRanges(
      entityMapper,
      parentIds,
      config.parentValueField ?? fieldId,
    );
    const parentName = findParentOutside(control.value, parents);
    if (!parentName) {
      return null;
    }
    return {
      withinParent: {
        warning: true,
        errorMessage: $localize`Outside the period of ${parentName}`,
      },
    };
  };
}

/** `withinParent: { parentReferenceField: "parent" }`: the date range should lie within the one of the linked parent record */
@Injectable()
export class WithinParentValidator extends FieldValidator<WithinParentConfig> {
  static override key = "withinParent";
  override readonly datatypesSupported = [DateRangeDatatype];
  override readonly warning = "always";
  override readonly async = true;

  private readonly entityMapper = inject(EntityMapperService);

  build(
    value: WithinParentConfig,
    { entity, field }: ValidatorContext,
  ): AsyncPromiseValidatorFn | null {
    return value && field?.id
      ? withinParentValidator(value, field.id, entity, this.entityMapper)
      : null;
  }

  override dependsOn(value: WithinParentConfig): string[] {
    return value?.parentReferenceField ? [value.parentReferenceField] : [];
  }
}
