import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";

export interface DuplicatePair {
  record: Entity;
  possibleDuplicate: Entity;
}

/**
 * Datatypes whose value {@link normalizeValue} cannot reduce to a comparable string,
 * so that selecting such a field could only ever produce zero matches.
 */
const UNMATCHABLE_DATATYPES = new Set([
  "location",
  "time-interval",
  "event-attendance-map",
  "attendance",
  "schema-embed",
]);

/**
 * Whether duplicates can be detected by comparing this field at all.
 *
 * Array values and objects without a plain `id` normalize to "", which excludes the
 * record from matching entirely - so offering such a field would silently return
 * "no duplicates found" rather than no result for that field.
 */
export function isMatchableField(field: EntitySchemaField): boolean {
  return !field.isArray && !UNMATCHABLE_DATATYPES.has(field.dataType);
}

@Injectable({
  providedIn: "root",
})
export class DuplicateDetectionService {
  private readonly entityMapper = inject(EntityMapperService);

  /**
   * Records sharing the same values in all the given fields, as pairs to review.
   *
   * The analysis is kept up to date from the entity updates while subscribed, so that
   * merging a pair (or any other change to the data) does not require a new scan of the
   * whole entity type - which is what made resolving many duplicates in a row expensive
   * (#4134). Unsubscribing stops the analysis.
   */
  watchDuplicates(
    entityConstructor: EntityConstructor,
    fields: string[],
  ): Observable<DuplicatePair[]> {
    return new Observable<DuplicatePair[]>((subscriber) => {
      if (fields.length === 0) {
        subscriber.next([]);
        return;
      }

      const index = new DuplicateIndex(fields);
      const bufferedUpdates: UpdatedEntity<Entity>[] = [];
      let initialised = false;
      let cancelled = false;

      // subscribe before the initial load, so changes made while it is in flight are
      // not lost; they are replayed afterwards (applying an update is idempotent)
      const updates = this.entityMapper
        .receiveUpdates(entityConstructor)
        .subscribe((update) => {
          if (!initialised) {
            bufferedUpdates.push(update);
            return;
          }
          index.apply(update);
          subscriber.next(index.buildPairs());
        });

      this.entityMapper
        .loadType(entityConstructor)
        .then((entities) => {
          if (cancelled) return;
          index.init(entities);
          bufferedUpdates.forEach((update) => index.apply(update));
          bufferedUpdates.length = 0;
          initialised = true;
          subscriber.next(index.buildPairs());
        })
        .catch((error) => {
          if (!cancelled) subscriber.error(error);
        });

      return () => {
        cancelled = true;
        updates.unsubscribe();
      };
    });
  }
}

/**
 * Groups records by the values of the compared fields and keeps that grouping up to
 * date as individual records change, so that no change requires a full rescan.
 */
class DuplicateIndex {
  constructor(private readonly fields: string[]) {}

  /** the latest known instance of each record that has a match key */
  private readonly entityById = new Map<string, Entity>();
  /**
   * the match key each record currently sits under.
   *
   * Required rather than merely convenient: a removal arrives as a tombstone without any
   * field data, so the key it has to be removed from cannot be recomputed at that point.
   */
  private readonly keyById = new Map<string, string>();
  /** the records sharing a match key, in the order they were first seen */
  private readonly idsByKey = new Map<string, Set<string>>();
  /** the pairs of each group, rebuilt only for the groups a change touched */
  private readonly pairsByKey = new Map<string, DuplicatePair[]>();

  init(entities: Entity[]) {
    for (const entity of entities) {
      this.addToIndex(entity);
    }
    for (const key of this.idsByKey.keys()) {
      this.rebuildPairs(key);
    }
  }

  apply(update: UpdatedEntity<Entity>) {
    if (update.type === "remove") {
      this.removeFromIndex(update.entity.getId());
      return;
    }
    // "new" and "update" are indistinguishable here and need the same handling
    this.upsert(update.entity);
  }

  buildPairs(): DuplicatePair[] {
    return [...this.idsByKey.keys()].flatMap(
      (key) => this.pairsByKey.get(key) ?? [],
    );
  }

  private upsert(entity: Entity) {
    const id = entity.getId();
    const newKey = this.computeKey(entity);
    const oldKey = this.keyById.get(id);

    if (oldKey !== undefined && oldKey !== newKey) {
      this.removeFromIndex(id);
    }

    if (newKey === undefined) {
      // the record no longer has a value in every compared field
      return;
    }

    this.entityById.set(id, entity);
    if (oldKey !== newKey) {
      this.keyById.set(id, newKey);
      if (!this.idsByKey.has(newKey)) {
        this.idsByKey.set(newKey, new Set());
      }
      this.idsByKey.get(newKey).add(id);
    }
    // also on an unchanged key, so the pairs hold the updated instance rather than a
    // stale one, whose outdated _rev would make a later merge fail with a conflict
    this.rebuildPairs(newKey);
  }

  private removeFromIndex(id: string) {
    const key = this.keyById.get(id);
    this.keyById.delete(id);
    this.entityById.delete(id);
    if (key === undefined) return;

    const group = this.idsByKey.get(key);
    group?.delete(id);
    if (!group || group.size === 0) {
      this.idsByKey.delete(key);
      this.pairsByKey.delete(key);
    } else {
      this.rebuildPairs(key);
    }
  }

  private addToIndex(entity: Entity) {
    const key = this.computeKey(entity);
    if (key === undefined) return;

    const id = entity.getId();
    this.entityById.set(id, entity);
    this.keyById.set(id, key);
    if (!this.idsByKey.has(key)) {
      this.idsByKey.set(key, new Set());
    }
    this.idsByKey.get(key).add(id);
  }

  /**
   * Pair every other member of the group with the one seen first.
   *
   * Pairing each member with each other one would be quadratic in the group's size,
   * which a field with few distinct values (a category, a centre) turns into a list of
   * millions. Anchoring keeps it at one row per additional member while still surfacing
   * all of them - and since a merge started from this list always keeps the first record
   * and removes the second, merging never moves the anchor and so never reshuffles the
   * rows the user is working through.
   */
  private rebuildPairs(key: string) {
    const ids = [...(this.idsByKey.get(key) ?? [])];
    if (ids.length < 2) {
      this.pairsByKey.delete(key);
      return;
    }

    const anchor = this.entityById.get(ids[0]);
    this.pairsByKey.set(
      key,
      ids.slice(1).map((id) => ({
        record: anchor,
        possibleDuplicate: this.entityById.get(id),
      })),
    );
  }

  /** The value identifying duplicates, or undefined if this record cannot match any other. */
  private computeKey(entity: Entity): string | undefined {
    const values: string[] = [];
    for (const field of this.fields) {
      const value = normalizeValue(entity[field]);
      if (value === "") return undefined;
      values.push(value);
    }
    // JSON rather than joining on a separator: the normalized values keep their
    // punctuation, so any separator could also occur inside a value and make
    // ["a|b", "c"] collide with ["a", "b|c"]
    return JSON.stringify(values);
  }
}

/** The comparable form of a field value, or "" where it cannot be compared. */
function normalizeValue(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().toLowerCase();
  // Arrays are intentionally excluded in this first exact-match implementation.
  // Selecting an array field will therefore not yield duplicate matches.
  if (Array.isArray(value)) return "";

  if (typeof value === "object") {
    const idValue = (value as Record<string, unknown>)["id"];
    return typeof idValue === "string" ||
      typeof idValue === "number" ||
      typeof idValue === "boolean"
      ? String(idValue).normalize("NFKC").trim().toLowerCase()
      : "";
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return "";
  }

  return String(value)
    .normalize("NFKC")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
