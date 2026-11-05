import { Entity } from "./entity";
import { EntitySchema } from "../schema/entity-schema";

/**
 * Where an {@link EmbeddedEntity} belongs.
 */
export interface EmbeddedEntityContext {
  /**
   * The record holding the entry, which is saved instead of the entry
   * (itself an EmbeddedEntity if the entry is nested in another embedded entry).
   * Not set if the entry is edited without a record, e.g. for a default value in the Admin UI.
   */
  record?: Entity;

  /** id of the record's field holding the entry */
  field: string;

  /** whether the entry already exists in the record (edited instead of added) */
  existing: boolean;
}

/**
 * Stand-in for a single entry of an embedded field (e.g. one row of a `schema-embed-array` field)
 * while it is edited, so that the entry goes through the standard entity form logic like a record:
 * its inner fields get the same validators, edit components and handling of empty values as top-level fields.
 *
 * It only exists while editing; the entry is stored as a plain object in its record (see {@link toEntryValue}).
 * It is never saved on its own (`EntityMapperService` refuses to), and permissions are checked
 * on the field of the record holding it (see `EntityAbility`).
 *
 * Create it with {@link createEmbeddedEntity}.
 */
export abstract class EmbeddedEntity extends Entity {
  static override readonly ENTITY_TYPE = "EmbeddedEntity";

  /**
   * Where this entry belongs.
   * Set after construction, because `copy()` creates new instances only from an id.
   */
  _embeddedIn: EmbeddedEntityContext;

  override get isNew(): boolean {
    return !this._embeddedIn.existing;
  }

  /**
   * The saved record holding this entry and the record's field holding it,
   * walking up through entries nested in other embedded entries.
   */
  getRoot(): { record: Entity; field: string } | undefined {
    let context = this._embeddedIn;
    while (context.record instanceof EmbeddedEntity) {
      context = context.record._embeddedIn;
    }
    return context.record
      ? { record: context.record, field: context.field }
      : undefined;
  }

  /**
   * The entry as it is stored in the record's field: a plain object of its inner fields,
   * without the properties of this stand-in. Inner fields without a value are left out.
   *
   * @param base the entry as it was before editing, whose properties that are no inner fields
   *             (e.g. of inner fields removed from the config) are kept
   */
  toEntryValue(base: Record<string, any> = {}): Record<string, any> {
    const entry = { ...base };
    for (const key of this.getSchema().keys()) {
      if (this[key] === undefined) {
        delete entry[key];
      } else {
        entry[key] = this[key];
      }
    }
    return entry;
  }
}

/**
 * Wrap an entry of an embedded field as {@link EmbeddedEntity}, to edit it like a record.
 *
 * @param schema the inner fields of the entry (see `getEmbeddedSchema`)
 * @param context where the entry belongs
 * @param entry the current values of the entry (not changed); none for a new entry
 */
export function createEmbeddedEntity(
  schema: EntitySchema,
  context: EmbeddedEntityContext,
  entry?: Record<string, any>,
): EmbeddedEntity {
  class EmbeddedEntry extends EmbeddedEntity {
    static override readonly schema = schema;
  }

  const embeddedEntity = new EmbeddedEntry();
  Object.assign(embeddedEntity, entry);
  embeddedEntity._embeddedIn = context;
  return embeddedEntity;
}

/**
 * The record that is actually saved for the given entity:
 * the record holding it, if it is an {@link EmbeddedEntity}, otherwise the entity itself.
 */
export function getSavedRecord(entity: Entity): Entity {
  return entity instanceof EmbeddedEntity
    ? (entity.getRoot()?.record ?? entity)
    : entity;
}
