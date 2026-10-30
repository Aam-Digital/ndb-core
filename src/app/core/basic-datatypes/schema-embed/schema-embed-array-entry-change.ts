import { isEqual } from "lodash-es";

/**
 * A change of a single entry of a `schema-embed-array` field, as made in its popup.
 *
 * It only describes the edited entry (not the whole list of entries), so that it can be applied
 * to the latest entries when saving, which may have been updated since the popup opened (e.g. by a sync).
 */
export type SchemaEmbedArrayEntryChange =
  | {
      /** The values of the new or edited entry */
      entry: Record<string, any>;
      /** Position of the edited entry when the popup opened; a new entry is added if not given */
      index?: number;
      /** The edited entry as it was when the popup opened */
      original?: Record<string, any>;
    }
  | {
      /** Remove the entry */
      delete: true;
      /** Position of the deleted entry when the popup opened */
      index: number;
      /** The deleted entry as it was when the popup opened */
      original: Record<string, any>;
    };

/**
 * The opened entry is no longer found in the latest entries,
 * because it has been changed or removed in the meantime (e.g. by another user).
 */
export class SchemaEmbedArrayEntryConflictError extends Error {
  constructor() {
    super(
      $localize`This entry has been changed or deleted in the meantime. Please close the popup and try again.`,
    );
    this.name = "SchemaEmbedArrayEntryConflictError";
  }
}

/**
 * Apply the change of a single entry to the latest list of entries,
 * keeping all other entries as they are now.
 *
 * @param entries the latest entries of the field (not mutated)
 * @param change the change made in the popup of an entry
 * @returns the changed list of entries
 * @throws SchemaEmbedArrayEntryConflictError if the edited or deleted entry has been changed or removed in the meantime
 */
export function applySchemaEmbedArrayEntryChange(
  entries: Record<string, any>[] | undefined,
  change: SchemaEmbedArrayEntryChange,
): Record<string, any>[] {
  const result = [...(entries ?? [])];
  if (change.index === undefined) {
    if ("entry" in change) {
      result.push(change.entry);
    }
    return result;
  }

  const index = findCurrentIndex(result, change.index, change.original);
  if ("delete" in change) {
    result.splice(index, 1);
  } else {
    // keep values of inner fields that are not edited in the popup
    result[index] = { ...result[index], ...change.entry };
  }
  return result;
}

/**
 * Find the position of the opened entry within the latest entries,
 * which may have moved if other entries were added or removed in the meantime.
 */
function findCurrentIndex(
  entries: Record<string, any>[],
  index: number,
  original: Record<string, any> | undefined,
): number {
  if (isEqual(entries[index], original)) {
    return index;
  }
  const matches = entries
    .map((entry, i) => (isEqual(entry, original) ? i : -1))
    .filter((i) => i >= 0);
  if (matches.length !== 1) {
    // changed or removed, or ambiguous between identical entries
    throw new SchemaEmbedArrayEntryConflictError();
  }
  return matches[0];
}
