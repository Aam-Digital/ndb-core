import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../../children/model/child";
import { Note } from "../model/note";
import { MeetingNoteAttendance } from "../meeting-note-attendance";
import { faker } from "../../../core/demo-data/faker";
import { WarningLevel } from "../../warning-level";
import { noteIndividualStories } from "./notes_individual-stories";
import { noteGroupStories } from "./notes_group-stories";
import { centersUnique } from "../../children/demo-data-generators/fixtures/centers";
import { absenceRemarks } from "./remarks";
import moment from "moment";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";

export class DemoNoteConfig {
  minNotesPerChild: number;
  maxNotesPerChild: number;
  groupNotes: number;
}

/**
 * Generate a number of Note entities for each Child.
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoNoteGeneratorService extends DemoDataGenerator<Note> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoNoteGeneratorService.provider()]`
   */
  static provider(
    config: DemoNoteConfig = {
      minNotesPerChild: 2,
      maxNotesPerChild: 10,
      groupNotes: 5,
    }
  ) {
    return [
      { provide: DemoNoteGeneratorService, useClass: DemoNoteGeneratorService },
      { provide: DemoNoteConfig, useValue: config },
    ];
  }

  private _teamMembers;
  get teamMembers(): string[] {
    const numberOfTeamMembers = 5;
    if (!this._teamMembers) {
      this._teamMembers = Array(numberOfTeamMembers)
        .fill("")
        .map(() => faker.name.firstName());
    }

    return this._teamMembers;
  }

  constructor(
    private config: DemoNoteConfig,
    private demoChildren: DemoChildGenerator,
    private schemaService: EntitySchemaService
  ) {
    super();
  }

  public generateEntities(): Note[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      const numberOfNotes = faker.random.number({
        min: this.config.minNotesPerChild,
        max: this.config.maxNotesPerChild,
      });
      for (let i = 0; i < numberOfNotes; i++) {
        data.push(this.generateNoteForChild(child));
      }

      // generate a recent note for the last week for some children to have data for dashboard
      if (faker.random.number(100) < 40) {
        data.push(
          this.generateNoteForChild(
            child,
            faker.date.between(
              moment().subtract(6, "days").toDate(),
              faker.getEarlierDateOrToday(child.dropoutDate)
            )
          )
        );
      }
    }

    for (const center of centersUnique) {
      const children: Child[] = this.demoChildren.entities.filter(
        (c) => c.center === center
      );
      for (let i = 0; i < this.config.groupNotes; i++) {
        data.push(this.generateGroupNote(children));
      }
    }

    return data;
  }

  private generateNoteForChild(child: Child, date?: Date): Note {
    let note = new Note(faker.random.uuid());

    const selectedStory = faker.random.arrayElement(noteIndividualStories);
    Object.assign(note, selectedStory);
    // transform to ensure the category object is loaded from the generic config
    note = this.schemaService.transformDatabaseToEntityFormat(
      note,
      Note.schema
    );

    note.addChild(child.getId());
    note.author = faker.random.arrayElement(this.teamMembers);

    if (!date) {
      date = faker.date.between(
        child.admissionDate,
        faker.getEarlierDateOrToday(child.dropoutDate)
      );
    }
    note.date = date;

    this.removeFollowUpMarkerForOldNotes(note);

    return note;
  }

  /**
   * Set all older notes to be "resolved" in order to keep the list of notes needing follow-up limited in the demo.
   */
  private removeFollowUpMarkerForOldNotes(note: Note) {
    const lastMonths = new Date();
    lastMonths.setMonth(lastMonths.getMonth() - 1);
    if (note.date < lastMonths) {
      note.warningLevel = WarningLevel.OK;
    }
  }

  private generateGroupNote(children: Child[]) {
    let note = new Note(faker.random.uuid());

    const selectedStory = faker.random.arrayElement(noteGroupStories);
    Object.assign(note, selectedStory);
    // transform to ensure the category object is loaded from the generic config
    note = this.schemaService.transformDatabaseToEntityFormat(
      note,
      Note.schema
    );

    note.children = children.map((c) => c.getId());
    note.attendances = children.map((child) => {
      const attendance = new MeetingNoteAttendance(child.getId());
      // get an approximate presence of 85%
      if (faker.random.number(100) <= 15) {
        attendance.present = false;
        attendance.remarks = faker.random.arrayElement(absenceRemarks);
      }
      return attendance;
    });

    note.author = faker.random.arrayElement(this.teamMembers);
    note.date = faker.date.past(1);

    this.removeFollowUpMarkerForOldNotes(note);

    return note;
  }
}
