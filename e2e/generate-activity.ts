import { Entity } from "#src/app/core/entity/model/entity.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types.js";
import { InteractionType } from "#src/app/child-dev-project/notes/model/interaction-type.interface.js";
import { faker } from "#src/app/core/demo-data/faker.js";

export interface ActivityEntity extends Entity {
  title: string;
  type: InteractionType;
  participants: string[];
  assignedTo: string[];
}

const ACTIVITY_TYPES = [
  defaultInteractionTypes.find((t) => t.id === "SCHOOL_CLASS"),
  defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
];

export function generateActivity({
  participants,
  assignedUser,
  title,
}: {
  participants: Entity[];
  assignedUser?: Entity;
  title?: string;
}): ActivityEntity {
  const activity = createEntityOfType(
    "RecurringActivity",
    faker.string.uuid(),
  ) as ActivityEntity;
  const type = faker.helpers.arrayElement(ACTIVITY_TYPES);

  activity.title =
    title ??
    type.label +
      " " +
      faker.number.int({ min: 1, max: 9 }) +
      faker.string.alphanumeric(1).toUpperCase();
  activity.type = type;
  activity.participants = participants.map((c) => c.getId());
  activity.assignedTo = [assignedUser?.getId()];

  return activity;
}
