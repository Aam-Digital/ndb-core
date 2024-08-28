import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { Note } from "../../notes/model/note";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "../../notes/model/interaction-type.interface";
import { asArray } from "../../../utils/utils";

@DatabaseEntity("RecurringActivity")
export class RecurringActivity extends Entity {
  static override route = "attendance/recurring-activity";

  static create(title: string = ""): RecurringActivity {
    const instance = new RecurringActivity();
    instance.title = title;
    return instance;
  }

  /**
   * Check whether the given note instance represents an event of a recurring activity
   * @param note
   */
  static isActivityEventNote(note: Note) {
    return (note?.relatesTo ?? "").startsWith(RecurringActivity.ENTITY_TYPE);
  }

  /** primary name to identify the activity */
  @DatabaseField()
  title: string = "";

  /**
   * a category to group and filter activities by.
   *
   * This is also assigned to individual events' category generated for this activity.
   */
  @DatabaseField({
    dataType: "configurable-enum",
    additional: INTERACTION_TYPE_CONFIG_ID,
  })
  type: InteractionType;

  /** IDs of children linked to this activity */
  @DatabaseField({
    dataType: "entity",
    isArray: true,
  })
  participants: string[] = [];

  /** IDs of groups (schools, teams) whose (active) members should be included in the activity*/
  @DatabaseField({
    dataType: "entity",
    isArray: true,
  })
  linkedGroups: string[] = [];

  /** IDs of children that should be excluded from this activity despite being a group member */
  @DatabaseField({
    dataType: "entity",
    isArray: true,
  })
  excludedParticipants: string[] = [];

  /** IDs of the users who are responsible for conducting this activity */
  @DatabaseField({
    dataType: "entity",
    isArray: true,
  })
  assignedTo: string[] = [];

  isAssignedTo(username: string): boolean {
    return !!asArray(this.assignedTo).find((name) => username === name);
  }
}
