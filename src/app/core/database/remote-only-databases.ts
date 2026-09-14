import { entityRegistry } from "../entity/database-entity.decorator";

/**
 * Whether the given database name belongs to an entity type that declares
 * {@link Entity.DATABASE_REMOTE_ONLY}.
 *
 * This reads the module-level registry rather than an injected one, so that
 * DatabaseResolverService can decide how to create a database without taking a
 * dependency on the entity layer's DI graph.
 */
export function isRemoteOnlyDatabase(dbName: string): boolean {
  return entityRegistry
    .getEntityTypes()
    .some(
      ({ value }) => value.DATABASE_REMOTE_ONLY && value.DATABASE === dbName,
    );
}
