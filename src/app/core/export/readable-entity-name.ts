import { Entity } from "../entity/model/entity";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { isConnectivityError } from "../../utils/connectivity-error";

/** Placeholder exported for a referenced entity that does not exist (or cannot be read). */
export const ENTITY_NOT_FOUND_PLACEHOLDER = "<not_found>";

/**
 * Load a referenced entity and return its human-readable name for exports.
 *
 * Only a reference that really cannot be resolved (deleted, no permission, unknown type)
 * results in {@link ENTITY_NOT_FOUND_PLACEHOLDER}. A transient failure (connection problem,
 * timeout, gateway error) is NOT disguised as "not found" - it is rethrown, so that the export
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
  const cacheKey = `${type}|${entityId}`;

  const cached = cache?.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = entityMapper.load(type, entityId).then(
    (entity) => entity?.toString() ?? ENTITY_NOT_FOUND_PLACEHOLDER,
    (err) => {
      if (isConnectivityError(err)) {
        // do not keep a failure in the cache, so that a later attempt can try again
        cache?.delete(cacheKey);
        throw err;
      }
      return ENTITY_NOT_FOUND_PLACEHOLDER;
    },
  );
  cache?.set(cacheKey, result);
  return result;
}

function safeExtractType(entityId: string): string | undefined {
  try {
    return Entity.extractTypeFromId(entityId);
  } catch {
    return undefined;
  }
}
