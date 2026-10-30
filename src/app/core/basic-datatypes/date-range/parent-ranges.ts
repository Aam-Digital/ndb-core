import { inject, resource } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../entity/model/entity";
import { WithinParentConfig } from "../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { Logging } from "../../logging/logging.service";
import { asArray } from "app/utils/asArray";
import { DateRangeValue } from "./date-range.datatype";
import { isOutsideRange } from "./is-outside-range";

/** the range of a linked parent record (see {@link WithinParentConfig}) */
export interface ParentRange {
  name: string;
  range: DateRangeValue;
}

/** the parent link as entered in a form (e.g. its form control) */
export interface ParentLinkInForm {
  value: string | string[] | null;
}

/**
 * The ids of the parent records to compare a record's range with:
 * the link entered in the form if the form has a field for it, otherwise the record's saved link.
 * None for an anonymized record, whose dates are reduced to the year.
 */
export function getParentIds(
  config: WithinParentConfig,
  record: Entity | undefined,
  linkInForm?: ParentLinkInForm | null,
): string[] {
  if (record?.anonymized) {
    return [];
  }
  return asArray(
    (linkInForm ? linkInForm.value : record?.[config.parentReferenceField]) ??
      [],
  );
}

/**
 * Loads the ranges of the given parent records
 * (except anonymized ones, whose dates are reduced to the year, and the ones that cannot be loaded).
 */
export async function loadParentRanges(
  entityMapper: EntityMapperService,
  parentIds: string[],
  valueField: string,
): Promise<ParentRange[]> {
  const load = async (id: string): Promise<Entity | undefined> => {
    try {
      return await entityMapper.load(Entity.extractTypeFromId(id), id);
    } catch (e) {
      Logging.debug("[DATE_RANGE] Could not load parent record.", id, e);
      return undefined;
    }
  };
  const parents = await Promise.all(parentIds.map((id) => load(id)));
  return parents
    .filter((parent) => !!parent && !parent.anonymized)
    .map((parent) => ({
      name: parent.toString(),
      range: parent[valueField],
    }));
}

/**
 * Loads the ranges of the parent records that a record links to (see {@link getParentIds} and {@link loadParentRanges}).
 * Must be called in an injection context (e.g. as a field initializer of a component).
 *
 * @param params the record, the id and the `withinParent` config of its field (without a config nothing is loaded)
 *   and the parent link entered in the form, if the form has a field for it
 */
export function parentRangesResource(
  params: () => {
    record: Entity | undefined;
    fieldId: string | undefined;
    config: WithinParentConfig | undefined;
    linkInForm?: ParentLinkInForm;
  },
) {
  const entityMapper = inject(EntityMapperService);

  return resource({
    params: () => {
      const { record, fieldId, config, linkInForm } = params();
      const parentIds = config ? getParentIds(config, record, linkInForm) : [];
      return parentIds.length
        ? { parentIds, valueField: config.parentValueField ?? fieldId }
        : undefined;
    },
    loader: ({ params: { parentIds, valueField } }) =>
      loadParentRanges(entityMapper, parentIds, valueField),
  });
}

/** name of the first parent whose range the given range goes beyond */
export function findParentOutside(
  range: DateRangeValue | null | undefined,
  parents: ParentRange[] | undefined,
): string | undefined {
  return parents?.find((parent) => isOutsideRange(range, parent.range))?.name;
}
