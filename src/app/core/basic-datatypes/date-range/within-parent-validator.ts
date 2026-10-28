import { AsyncPromiseValidatorFn } from "../../common-components/entity-form/dynamic-form-validators/validator-types";
import { WithinParentConfig } from "../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { Entity } from "../../entity/model/entity";
import { asArray } from "app/utils/asArray";
import { findParentOutside, ParentRange } from "./parent-ranges";

/**
 * Validator for a date range that should lie within the range of the parent record(s) it links to.
 * Its error is only a warning (`warning: true`): the record can still be saved after confirming it.
 * The parent link is taken from the form, or from the saved record if the form has no field for it.
 */
export function withinParentValidator(
  config: WithinParentConfig,
  fieldId: string,
  record: Entity | undefined,
  loadParents: (
    parentIds: string[],
    valueField: string,
  ) => Promise<ParentRange[]>,
): AsyncPromiseValidatorFn {
  return async (control) => {
    if (record?.anonymized) {
      return null;
    }
    const linkInForm = control.parent?.get(config.parentReferenceField);
    const parentIds = asArray(
      (linkInForm ? linkInForm.value : record?.[config.parentReferenceField]) ??
        [],
    );
    if (!parentIds.length) {
      return null;
    }

    const parents = await loadParents(
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
