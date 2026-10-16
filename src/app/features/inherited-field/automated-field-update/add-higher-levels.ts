import { isEqual, uniq } from "lodash-es";
import { addMissingValues } from "../add-missing-values";
import type { AffectedEntity } from "./automated-field-update.component";

/** Number of levels above the changed entity that are included in one update dialog. */
export const MAX_HIERARCHY_LEVELS = 10;

/**
 * Add the entities further up the hierarchy that the rules would update, based on the suggested values
 * of the entities of the level below (e.g. the parent of a parent), level by level.
 * An entity that is reached over several paths is listed once, with all the records it is reached from.
 *
 * @param firstLevel the entities directly linked to the changed entity
 * @param changedEntityId the id of the entity whose change started the update (never offered for an update itself)
 * @param loadNextLevel finds the entities that would be updated if the given affected entity had its suggested value,
 *   given all affected entities found so far (whose suggested values are not saved yet)
 * @return all affected entities, ordered by level
 */
export async function addHigherLevels(
  firstLevel: AffectedEntity[],
  changedEntityId: string,
  loadNextLevel: (
    affected: AffectedEntity,
    found: AffectedEntity[],
  ) => Promise<AffectedEntity[]>,
): Promise<AffectedEntity[]> {
  const rows = new Map<string, AffectedEntity>();

  /** @return the row if it is new or got additional values, otherwise undefined */
  const addRow = (row: AffectedEntity, via: string, level: number) => {
    const key = `${row.id}|${row.targetFieldId}`;
    const existing = rows.get(key);
    if (!existing) {
      rows.set(key, { ...row, level, via: [via] });
      return rows.get(key);
    }

    existing.via = uniq([...existing.via, via]);
    existing.level = Math.max(existing.level, level);
    const mergedValue = existing.addToExisting
      ? addMissingValues(existing.newValue, row.newValue)
      : existing.newValue;
    if (isEqual(mergedValue, existing.newValue)) return undefined;
    existing.newValue = mergedValue;
    return existing;
  };

  let currentLevel = firstLevel
    .map((row) => addRow(row, changedEntityId, 1))
    .filter((row) => !!row);
  for (
    let level = 2;
    level <= MAX_HIERARCHY_LEVELS && currentLevel.length > 0;
    level++
  ) {
    const nextLevel: AffectedEntity[] = [];
    for (const source of currentLevel) {
      (await loadNextLevel(source, [...rows.values()]))
        .filter((row) => row.id !== changedEntityId)
        .map((row) => addRow(row, source.id, level))
        .filter((row) => !!row)
        .forEach((row) => nextLevel.push(row));
    }
    currentLevel = uniq(nextLevel);
  }

  return [...rows.values()].sort((a, b) => a.level - b.level);
}
