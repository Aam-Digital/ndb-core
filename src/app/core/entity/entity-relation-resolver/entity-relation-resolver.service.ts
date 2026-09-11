import { inject, Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { EntitySchema } from "../schema/entity-schema";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { Logging } from "../../logging/logging.service";

/**
 * A related entity that could not be found in the database is represented by
 * this minimal stub instead, so that templates can still access its id.
 */
export interface UnresolvedEntityStub {
  _id: string;
}

/**
 * Resolve entity-reference fields (`dataType: "entity"`) within a record's data,
 * replacing the plain id string(s) with the actual referenced {@link Entity} objects.
 *
 * This is used to give file/PDF templates access to the details of linked records
 * (e.g. a Note's related Child) instead of only their id.
 *
 * Only the relations found directly on the given data (including relations nested
 * inside embedded objects/arrays that have their own schema, e.g. `AttendanceItem`)
 * are resolved. The relations *of* a newly resolved entity are deliberately left
 * untouched, to avoid pulling in an ever-growing tree of linked records.
 *
 * The input data is never modified - resolved data is always built as a new,
 * deep copy so that entity objects still in use elsewhere in the app remain unaffected.
 *
 * Note: this is unrelated to {@link EntityRelationsService}, which instead finds
 * entities that reference a given entity (the reverse direction).
 */
@Injectable({
  providedIn: "root",
})
export class EntityRelationResolverService {
  private readonly entityMapper = inject(EntityMapperService);

  /**
   * Resolve entity-reference fields within the given record (or array of records).
   * @param data A single record or an array of records to resolve relations for.
   */
  async resolveRelations<T = any>(data: T): Promise<T>;
  async resolveRelations<T = any>(data: T[]): Promise<T[]>;
  async resolveRelations(data: any): Promise<any> {
    // cache loaded entities per type for the duration of this call,
    // so that every referenced type is loaded via `loadType` at most once,
    // no matter how many records or ids reference it.
    const loadedEntitiesByType = new Map<
      string,
      Promise<Map<string, Entity>>
    >();

    if (Array.isArray(data)) {
      return Promise.all(
        data.map((item) => this.resolveValue(item, loadedEntitiesByType)),
      );
    }
    return this.resolveValue(data, loadedEntitiesByType);
  }

  /**
   * Resolve one value: if it has an entity schema, return a new object with its
   * relation fields resolved (recursing into nested schema-holding values found
   * on it); otherwise return the value unchanged.
   */
  private async resolveValue(
    value: any,
    loadedEntitiesByType: Map<string, Promise<Map<string, Entity>>>,
  ): Promise<any> {
    if (value === null || typeof value !== "object") {
      return value;
    }

    const schema = this.getSchema(value);
    if (!schema) {
      return value;
    }

    const resolved: Record<string, any> = {};
    for (const [fieldId, fieldSchema] of schema) {
      const raw = value[fieldId];
      if (raw === undefined) {
        continue;
      }

      if (fieldSchema.dataType === EntityDatatype.dataType) {
        resolved[fieldId] = Array.isArray(raw)
          ? await Promise.all(
              raw.map((id) =>
                this.resolveReference(id, fieldSchema, loadedEntitiesByType),
              ),
            )
          : await this.resolveReference(raw, fieldSchema, loadedEntitiesByType);
      } else if (Array.isArray(raw)) {
        resolved[fieldId] = await Promise.all(
          raw.map((item) => this.resolveValue(item, loadedEntitiesByType)),
        );
      } else if (typeof raw === "object") {
        resolved[fieldId] = await this.resolveValue(raw, loadedEntitiesByType);
      } else {
        resolved[fieldId] = raw;
      }
    }
    return resolved;
  }

  /**
   * Resolve a single entity-reference id to the actual entity
   * (or an {@link UnresolvedEntityStub} if it cannot be resolved).
   * Deliberately does *not* resolve the relations of the returned entity itself.
   */
  private async resolveReference(
    id: unknown,
    fieldSchema: EntitySchemaField,
    loadedEntitiesByType: Map<string, Promise<Map<string, Entity>>>,
  ): Promise<Entity | UnresolvedEntityStub | unknown> {
    if (typeof id !== "string" || !id) {
      return id;
    }

    const entityType = this.getReferencedEntityType(id, fieldSchema);
    if (!entityType) {
      return { _id: id };
    }

    try {
      const entitiesOfType = await this.loadAllOfType(
        entityType,
        loadedEntitiesByType,
      );
      const match = entitiesOfType.get(id);
      // a shallow, one-level copy: protects the entity instance still held
      // elsewhere in the app from being mutated through the resolved data,
      // without resolving (and thereby recursing into) its own relations.
      return match ? this.copySchemaFieldsShallow(match) : { _id: id };
    } catch (err) {
      Logging.warn(
        `EntityRelationResolverService: failed to load entities of type "${entityType}" ` +
          `to resolve relation field "${fieldSchema.id}"`,
        err,
      );
      return { _id: id };
    }
  }

  /**
   * Determine the entity type an id belongs to: primarily from the id's own
   * type prefix (e.g. "Child:123"), falling back to the field's `additional`
   * config (a single type, or the first of multiple possible types) for the
   * rare case of an id stored without a prefix.
   */
  private getReferencedEntityType(
    id: string,
    fieldSchema: EntitySchemaField,
  ): string | undefined {
    const typeFromId = Entity.extractTypeFromId(id);
    if (typeFromId) {
      return typeFromId;
    }

    const { additional } = fieldSchema;
    if (typeof additional === "string") {
      return additional;
    }
    if (Array.isArray(additional) && typeof additional[0] === "string") {
      return additional[0];
    }
    return undefined;
  }

  /**
   * Load all entities of the given type, indexed by id.
   * Memoized in `loadedEntitiesByType` so repeated ids/records of the same
   * type only trigger a single `loadType` database request.
   */
  private loadAllOfType(
    entityType: string,
    loadedEntitiesByType: Map<string, Promise<Map<string, Entity>>>,
  ): Promise<Map<string, Entity>> {
    if (!loadedEntitiesByType.has(entityType)) {
      loadedEntitiesByType.set(
        entityType,
        this.entityMapper
          .loadType(entityType)
          .then((entities) => new Map(entities.map((e) => [e.getId(), e]))),
      );
    }
    return loadedEntitiesByType.get(entityType);
  }

  /**
   * Copy every schema field's current value onto a new plain object, one level deep.
   * Relation fields are copied as their raw (unresolved) id(s) - used for a resolved
   * related entity, which must not have its own relations resolved further.
   */
  private copySchemaFieldsShallow(value: Entity): Record<string, any> {
    const schema = this.getSchema(value);
    const copy: Record<string, any> = {};
    for (const [fieldId] of schema) {
      const raw = value[fieldId];
      if (raw !== undefined) {
        copy[fieldId] = raw;
      }
    }
    return copy;
  }

  private getSchema(value: object): EntitySchema | undefined {
    const schema = (value.constructor as { schema?: unknown })?.schema;
    return schema instanceof Map ? (schema as EntitySchema) : undefined;
  }
}
