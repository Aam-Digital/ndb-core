import { inject, resource } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../entity/model/entity";
import { WithinParentConfig } from "../../entity/schema/entity-schema-field";
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
 * Loads the ranges of the parent records that a record links to.
 * Must be called in an injection context (e.g. as a field initializer of a component).
 *
 * @param params the parent link (one or several ids) and the config of the field, or undefined if there is nothing to check
 */
export function parentRangesResource(
  params: () =>
    | {
        parentReference: string | string[] | null | undefined;
        config: WithinParentConfig;
      }
    | undefined,
) {
  const entityMapper = inject(EntityMapperService);

  async function load(id: string): Promise<Entity | undefined> {
    try {
      return await entityMapper.load(Entity.extractTypeFromId(id), id);
    } catch (e) {
      Logging.debug("[DATE_RANGE] Could not load parent record.", id, e);
      return undefined;
    }
  }

  return resource({
    params: () => {
      const current = params();
      const parentIds = asArray(current?.parentReference ?? []);
      return parentIds.length
        ? { parentIds, config: current.config }
        : undefined;
    },
    loader: async ({
      params: { parentIds, config },
    }): Promise<ParentRange[]> => {
      const parents = await Promise.all(parentIds.map((id) => load(id)));
      return parents
        .filter((parent) => !!parent)
        .map((parent) => ({
          name: parent.toString(),
          range: parent[config.parentValueField],
        }));
    },
  });
}

/** name of the first parent whose range the given range goes beyond */
export function findParentOutside(
  range: DateRangeValue | null | undefined,
  parents: ParentRange[] | undefined,
): string | undefined {
  return parents?.find((parent) => isOutsideRange(range, parent.range))?.name;
}
