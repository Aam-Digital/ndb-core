import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Note } from "#src/app/child-dev-project/notes/model/note";

/**
 * @deprecated The `EventNote` entity type is the default implementation bundled
 * with the attendance feature. New deployments should configure custom event
 * entity types via `AttendanceFeatureConfig.eventTypes` in the app config
 * (`"appConfig:attendance"`).
 */
@DatabaseEntity("EventNote")
export class EventNote extends Note {
  static override label = undefined; // hide the EventNote entity type from Admin UIs to avoid confusion with the Note entity type
  static override labelPlural = undefined;

  static override create(date: Date, subject: string = ""): EventNote {
    const instance = new EventNote();
    instance.date = date;
    instance.subject = subject;
    return instance;
  }
}
