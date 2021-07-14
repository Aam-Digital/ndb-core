import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../model/note";
import { User } from "../../../core/user/user";
import { AlertService } from "../../../core/alerts/alert.service";
import { Alert } from "../../../core/alerts/alert";
import { AlertDisplay } from "../../../core/alerts/alert-display";
import { RecurringActivity } from "../../attendance/model/recurring-activity";

@Injectable({
  providedIn: "root",
})
export class NotesMigrationService {
  allUsers: Map<string, User>;
  constructor(
    private entityMapperService: EntityMapperService,
    private alertService: AlertService
  ) {}

  /**
   * migrates all notes in the database to the new format.
   * <br>This format will include users as an array of string-id's
   * instead of a single field describing the author(s) of the note
   */
  async migrateToMultiUser() {
    console.log("Starting to migrate all Notes' authors");
    this.allUsers = new Map<string, User>(
      (await this.entityMapperService.loadType(User)).map((u) => [
        u.name.toLowerCase(),
        u,
      ])
    );
    const allNotes: Note[] = await this.entityMapperService.loadType(Note);
    let amountOfMigratedNotes = 0;
    for (const note of allNotes) {
      amountOfMigratedNotes += this.migrateSingleNote(note);
      await this.entityMapperService.save(note);
    }
    this.alertService.addAlert(
      new Alert(
        `Migrated ${amountOfMigratedNotes} note(s) `,
        Alert.INFO,
        AlertDisplay.TEMPORARY
      )
    );
    console.log(
      `Completed to migrate all Notes' authors (${amountOfMigratedNotes} note(s) total)`
    );

    this.migrateToMultiAssignedActivities();
  }

  async migrateToMultiAssignedActivities() {
    const allActivities: RecurringActivity[] =
      await this.entityMapperService.loadType(RecurringActivity);
    for (const act of allActivities) {
      act.assignedTo = [];
      await this.entityMapperService.save(act);
    }
  }

  /**
   * migrate a single note to the new format.
   * The 'author'-field will be deleted after the migration is done
   * @param note The note to migrate
   */
  public migrateSingleNote(note: Note): number {
    const userStr = note["author"];
    if (userStr === undefined || userStr === null) {
      // no migration necessary
      return 0;
    }
    const newUsers = this.findUsers(userStr);
    note.authors = newUsers.detectedUsers.map((u) => u.getId());
    delete note["author"];
    if (newUsers.additional.length > 0) {
      console.log("could not match all users", note);
      this.updateNoteText(note, newUsers.additional);
    }
    return 1;
  }

  private updateNoteText(note: Note, additionalUsers: string[]) {
    const additionalText = "Also authored by " + additionalUsers.join(", ");
    if (note.text.length === 0) {
      note.text = additionalText;
    } else {
      note.text += "\n" + additionalText;
    }
  }

  /**
   * finds a user based on the following assumptions:
   * <li> All leading and trailing whitespaces are ignored
   * <li> A single user will be matched by his case-insensitive name
   * <li> When the search string contains a ',' or '&'-character, multiple
   * users will be matched
   * <li> If the string to match contains a whitespace, this name will be matched
   * as well as all 'parts' of that name, meaning every sub-string, split by whitespaces
   * @param str the string to search
   */
  public findUsers(str: string): {
    detectedUsers: User[];
    additional: string[];
  } {
    const detectedUsers: User[] = [];
    const additional: string[] = [];
    // split on '&', 'and' and ','
    // remove any non alphabet-characters and non-whitespace-characters
    const searchStrings = str
      .trim()
      .replace(/&/g, ",")
      .replace(/and/g, ",")
      .split(",")
      .map((s) => s.replace(/[^a-zA-Z\s]/, "").trim());
    for (const searchString of searchStrings) {
      const user = this.findSingleUser(searchString);
      if (user) {
        detectedUsers.push(user);
      } else if (searchString.trim().length > 0) {
        additional.push(searchString.trim());
      }
    }
    return { detectedUsers: detectedUsers, additional: additional };
  }

  /**
   * Find a single user based on a search string that should represent a single user
   * @param str The string to look for
   */
  private findSingleUser(str: string): User | undefined {
    const lowerCaseSearch = str.toLowerCase();
    if (lowerCaseSearch.match(/\s/)) {
      return (
        // first look for a user that matches exactly (including whitespaces)
        this.allUsers.get(lowerCaseSearch) ||
        // If none is found, look for a user where any name (in most cases name and surname) matches
        lowerCaseSearch
          .split(/\s/)
          .map((s) => this.allUsers.get(s))
          .filter((u) => !!u)
          .pop()
      );
    } else {
      return this.allUsers.get(lowerCaseSearch);
    }
  }
}
