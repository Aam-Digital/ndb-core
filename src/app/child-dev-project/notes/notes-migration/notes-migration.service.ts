import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../model/note";
import { User } from "../../../core/user/user";
import { LoggingService } from "../../../core/logging/logging.service";

@Injectable({
  providedIn: "root",
})
export class NotesMigrationService {
  constructor(
    private entityMapperService: EntityMapperService,
    private loggingService: LoggingService
  ) {}

  async migrateToMultiUser() {
    const allNotes: Note[] = await this.entityMapperService.loadType<Note>(
      Note
    );
    const users: User[] = await this.entityMapperService.loadType<User>(User);
    for (const newNote of allNotes.map((oldNote) => {
      const user = users.find((u) => u.getId() === oldNote["author"]);
      if (user) {
        oldNote.authors = [user.getId()];
      } else {
        this.loggingService.warn("cannot migrate user ");
      }
      oldNote.authors = user ? [user.getId()] : [];
      return oldNote;
    })) {
      await this.entityMapperService.save<Note>(newNote);
    }
  }
}
