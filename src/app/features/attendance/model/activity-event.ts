import { Entity } from "#src/app/core/entity/model/entity";
import { RecurringActivity } from "./recurring-activity";

/**
 * An entity that represents a single event linked to a {@link RecurringActivity}
 * via the `relatesTo` field.
 *
 * Any entity type can implement this interface to be used with the attendance
 * roll-call flow and related components.
 */
export interface ActivityEvent extends Entity {
  /** ID of the {@link RecurringActivity} this event belongs to */
  relatesTo: string;
}

/**
 * Check whether the given entity instance represents an event of a recurring activity
 * @param entity
 */
export function isActivityEvent(entity: Entity): entity is ActivityEvent {
  return (entity?.["relatesTo"] ?? "").startsWith(
    RecurringActivity.ENTITY_TYPE,
  );
}
