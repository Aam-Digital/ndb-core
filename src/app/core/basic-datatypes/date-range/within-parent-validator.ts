import { DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { AsyncPromiseValidatorFn } from "../../common-components/entity-form/dynamic-form-validators/validator-types";
import { WithinParentConfig } from "../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
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
      record,
      control.parent?.get(config.parentReferenceField),
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

/**
 * Validate the fields with a `withinParent` validator again whenever their parent link changes in the same form,
 * as the validator reads that link from the form.
 */
export function revalidateOnParentLinkChange(
  form: FormGroup,
  fields: FormFieldConfig[],
  destroyRef: DestroyRef,
) {
  for (const field of fields) {
    const linkField = field.validators?.withinParent?.parentReferenceField;
    const control = form.get(field.id);
    const link = linkField && form.get(linkField);
    if (!control || !link) {
      continue;
    }
    link.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => control.updateValueAndValidity());
  }
}
