import { effect, inject, linkedSignal, Signal } from "@angular/core";
import { filter, merge } from "rxjs";
import { RegistryLookupError } from "../../config/registry/dynamic-registry";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../entity/model/entity";
import { applyUpdate } from "../../entity/model/entity-update";
import { Logging } from "../../logging/logging.service";

/**
 * Load a record that a link field refers to, `undefined` if it cannot be loaded
 * (not found, not permitted or of an unknown record type, which is not reported as a problem).
 */
export async function loadLinkedRecord<E extends Entity>(
  entityMapper: EntityMapperService,
  entityType: string,
  id: string,
): Promise<E | undefined> {
  return entityMapper
    .load<E>(entityType, id)
    .catch((err: { status?: number } | undefined) => {
      if (err?.status === 404 || err instanceof RegistryLookupError) {
        // a problem of the data or the config of an instance, not one of our code
        Logging.debug("[LINKED_RECORD] Linked record not found.", id);
      } else {
        Logging.warn("[LINKED_RECORD] Error loading linked record.", err, id);
      }
      return undefined;
    });
}

/**
 * Load the records with the given ids (the value of a link field), whatever their record types.
 * Records that cannot be loaded (see {@link loadLinkedRecord}) and values that are not an id are left out.
 * @param getLoaded a record that is loaded already (e.g. by the dropdown of the field), which is not loaded again
 */
export async function loadLinkedRecords(
  entityMapper: EntityMapperService,
  ids: unknown[],
  getLoaded: (id: string) => Entity | undefined = () => undefined,
): Promise<Entity[]> {
  const records = await Promise.all(
    ids
      .filter((id): id is string => !!id && typeof id === "string")
      .map(
        (id) =>
          getLoaded(id) ??
          loadLinkedRecord(entityMapper, Entity.extractTypeFromId(id), id),
      ),
  );
  return records.filter((record) => !!record);
}

/**
 * The given records in their latest version: they are replaced while they change in the database
 * (e.g. a parent record that an automated update changes after a record linking to it is saved),
 * and left out once deleted.
 * Must be called in an injection context (e.g. as a field initializer of a component).
 */
export function latestLinkedRecords(records: () => Entity[]): Signal<Entity[]> {
  const entityMapper = inject(EntityMapperService);
  const latest = linkedSignal(records);

  effect((onCleanup) => {
    const followed = records();
    const ids = new Set(followed.map((record) => record.getId()));
    const types = new Set(followed.map((record) => record.getType()));
    const subscription = merge(
      ...[...types].map((type) => entityMapper.receiveUpdates(type)),
    )
      .pipe(filter(({ entity }) => ids.has(entity.getId())))
      .subscribe((update) =>
        latest.update((current) => applyUpdate(current, update, false)),
      );
    onCleanup(() => subscription.unsubscribe());
  });

  return latest.asReadonly();
}
