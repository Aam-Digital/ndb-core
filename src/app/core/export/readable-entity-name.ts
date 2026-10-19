import { HttpStatusCode } from "@angular/common/http";
import { Entity } from "../entity/model/entity";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { EntityPermissionError } from "../entity/entity-mapper/entity-permission-error";
import { RegistryLookupError } from "../config/registry/dynamic-registry";

/** Placeholder exported for a referenced entity that does not exist (or cannot be read). */
export const ENTITY_NOT_FOUND_PLACEHOLDER = "<not_found>";

/**
 * Maximum number of rows (and of values within one row) that are resolved in parallel during an export.
 * Resolving referenced entities can require a database request per value; running
 * them all at once exhausts the browser's resources on large lists
 * (`net::ERR_INSUFFICIENT_RESOURCES`), making some of the requests fail.
 */
export const EXPORT_BATCH_SIZE = 20;

/**
 * Load a referenced entity and return its human-readable name for exports.
 *
 * Only a reference that really cannot be resolved (deleted, no permission, unknown type)
 * results in {@link ENTITY_NOT_FOUND_PLACEHOLDER}. Any other failure (connection problem,
 * expired session, server error) is NOT disguised as "not found" - it is rethrown, so that the export
 * fails visibly instead of silently containing wrong data for an entity that does exist.
 *
 * @param entityMapper used to load the entity
 * @param entityType type to use if the id has no type prefix
 * @param entityId id of the referenced entity (with or without type prefix)
 * @param cache optional, shared across one export run so every entity is loaded only once
 */
export function loadReadableEntityName(
  entityMapper: EntityMapperService,
  entityType: string | undefined,
  entityId: string,
  cache?: Map<string, Promise<string>>,
): Promise<string> {
  const type = safeExtractType(entityId) || entityType;
  const cacheKey = type ? Entity.createPrefixedId(type, entityId) : entityId;

  const cached = cache?.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = entityMapper.load(type, entityId).then(
    (entity) => entity?.toString() ?? ENTITY_NOT_FOUND_PLACEHOLDER,
    (err) => {
      if (isUnresolvableReferenceError(err)) {
        return ENTITY_NOT_FOUND_PLACEHOLDER;
      }
      // do not keep a failure in the cache, so that a later attempt can try again
      cache?.delete(cacheKey);
      throw err;
    },
  );
  cache?.set(cacheKey, result);
  return result;
}

/**
 * Whether the error means the referenced entity cannot be resolved at all
 * (rather than a failure that may succeed on another attempt).
 */
function isUnresolvableReferenceError(err: any): boolean {
  return (
    err?.status === HttpStatusCode.NotFound ||
    err?.status === HttpStatusCode.Forbidden ||
    err instanceof EntityPermissionError ||
    err instanceof RegistryLookupError
  );
}

function safeExtractType(entityId: string): string | undefined {
  try {
    return Entity.extractTypeFromId(entityId);
  } catch {
    return undefined;
  }
}
