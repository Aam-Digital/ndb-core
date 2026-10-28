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
 * Loads the ranges of the parent records that a record links to (see {@link loadParentRanges}).
 * Must be called in an injection context (e.g. as a field initializer of a component).
 *
 * @param params the parent link (one or several ids), the config and the id of the field, or undefined if there is nothing to check
 */
export function parentRangesResource(
  params: () =>
    | {
        parentReference: string | string[] | null | undefined;
        config: WithinParentConfig;
        fieldId: string;
      }
    | undefined,
) {
  const entityMapper = inject(EntityMapperService);

  return resource({
    params: () => {
      const current = params();
      const parentIds = asArray(current?.parentReference ?? []);
      return parentIds.length
        ? {
            parentIds,
            valueField: current.config.parentValueField ?? current.fieldId,
          }
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
