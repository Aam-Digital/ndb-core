import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { AttendanceItem } from "../../features/attendance/model/attendance-item";
import { AttendanceLogicalStatus } from "../../features/attendance/model/attendance-status";
import { defaultAttendanceStatusTypes } from "../../core/config/default-config/default-attendance-status-types";
import { EventWithAttendance } from "../../features/attendance/model/event-with-attendance";
import { IconName } from "@fortawesome/fontawesome-svg-core";

/**
 * Basic event entity type for unit tests, to avoid coupling tests to the deprecated EventNote class.
 *
 * Has date, title, and attendance fields — the minimal structure needed for attendance-related tests.
 */
@DatabaseEntity("TestEventEntity")
export class TestEventEntity extends Entity {
  static override readonly ENTITY_TYPE = "TestEventEntity";
  static override readonly label = "Test Event Entity";
  static override readonly labelPlural = "Test Event Entities";
  static override readonly icon: IconName = "calendar";

  @DatabaseField({ dataType: "date-only" })
  date: Date;

  @DatabaseField()
  title: string;

  @DatabaseField({ dataType: "attendance", isArray: true })
  attendance: AttendanceItem[] = [];

  @DatabaseField()
  relatesTo: string;

  static create(
    data: Partial<TestEventEntity> | Date = new Date(),
  ): TestEventEntity {
    if (data instanceof Date) {
      data = { date: data };
    }
    return Object.assign(new TestEventEntity(), data);
  }

  /**
   * Generate an event with participants for the given attendance status array.
   *
   * This is particularly useful to generate simple data for demo or test purposes.
   *
   * @param participating Tuples of [childId, AttendanceLogicalStatus] or [childId, AttendanceLogicalStatus, remarks]
   * @param date (Optional) date of the event; if not given today's date is used
   * @param activity (Optional) reference to the connected activity entity
   */
  static generateEventWithAttendance(
    participating: (
      | [string, AttendanceLogicalStatus]
      | [string, AttendanceLogicalStatus, string]
    )[],
    date = new Date(),
    activity?: Entity,
  ): EventWithAttendance {
    const event = TestEventEntity.create(date);
    for (const att of participating) {
      const item = new AttendanceItem();
      item.participant = att[0];
      item.status = defaultAttendanceStatusTypes.find(
        (t) => t.countAs === att[1],
      );
      if (att.length === 3) {
        item.remarks = att[2];
      }
      event.attendance.push(item);
    }
    event.relatesTo = activity?.getId();
    return new EventWithAttendance(
      event,
      "attendance",
      "date",
      "relatesTo",
      "authors",
      undefined,
    );
  }
}
