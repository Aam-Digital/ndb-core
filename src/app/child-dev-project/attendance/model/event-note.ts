import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Note } from "../../notes/model/note";

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
