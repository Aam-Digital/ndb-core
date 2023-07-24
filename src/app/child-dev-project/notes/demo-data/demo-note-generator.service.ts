import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../../children/model/child";
import { Note } from "../model/note";
import { faker } from "../../../core/demo-data/faker";
import { warningLevels } from "../../warning-levels";
import { noteIndividualStories } from "./notes_individual-stories";
import { noteGroupStories } from "./notes_group-stories";
import { centersUnique } from "../../children/demo-data-generators/fixtures/centers";
import { absenceRemarks } from "./remarks";
import moment from "moment";
import { AttendanceLogicalStatus } from "../../attendance/model/attendance-status";
import { DemoUserGeneratorService } from "../../../core/user/demo-user-generator.service";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";

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
    },
  ) {
    return [
      { provide: DemoNoteGeneratorService, useClass: DemoNoteGeneratorService },
      { provide: DemoNoteConfig, useValue: config },
    ];
  }

  constructor(
    private config: DemoNoteConfig,
    private demoChildren: DemoChildGenerator,
    private demoUsers: DemoUserGeneratorService,
  ) {
    super();
  }

  public generateEntities(): Note[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      if (!child.isActive) {
        continue;
      }

      let numberOfNotes = faker.number.int({
        min: this.config.minNotesPerChild,
        max: this.config.maxNotesPerChild,
      });

      // generate a recent note for the last week for some children to have data for dashboard
      if (numberOfNotes > 0 && faker.number.int(100) < 40) {
        data.push(
          this.generateNoteForChild(
            child,
            faker.date.between({
              from: moment().subtract(6, "days").toDate(),
              to: faker.getEarlierDateOrToday(child.dropoutDate),
            }),
          ),
        );
        numberOfNotes--;
      }

      for (let i = 0; i < numberOfNotes; i++) {
        data.push(this.generateNoteForChild(child));
      }
    }

    for (const center of centersUnique) {
      const children: Child[] = this.demoChildren.entities.filter(
        (c) => c.center === center,
      );
      for (let i = 0; i < this.config.groupNotes; i++) {
        data.push(this.generateGroupNote(children));
      }
    }

    return data;
  }

  private generateNoteForChild(child: Child, date?: Date): Note {
    const note = new Note();

    const selectedStory = faker.helpers.arrayElement(noteIndividualStories);
    Object.assign(note, selectedStory);

    note.addChild(child.getId());
    note.authors = [
      faker.helpers.arrayElement(this.demoUsers.entities).getId(),
    ];

    if (!date) {
      date = faker.date.between({
        from: child.admissionDate,
        to: faker.getEarlierDateOrToday(child.dropoutDate),
      });
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
      note.warningLevel = warningLevels.find((level) => level.id === "OK");
    }
  }

  private generateGroupNote(children: Child[]) {
    const note = new Note();

    const selectedStory = faker.helpers.arrayElement(noteGroupStories);
    Object.assign(note, selectedStory);

    note.children = children.map((c) => c.getId());
    children.forEach((child) => {
      const attendance = note.getAttendance(child.getId());
      // get an approximate presence of 85%
      if (faker.number.int(100) <= 15) {
        attendance.status = defaultAttendanceStatusTypes.find(
          (t) => t.countAs === AttendanceLogicalStatus.ABSENT,
        );
        attendance.remarks = faker.helpers.arrayElement(absenceRemarks);
      } else {
        attendance.status = defaultAttendanceStatusTypes.find(
          (t) => t.countAs === AttendanceLogicalStatus.PRESENT,
        );
      }
    });

    note.authors = [
      faker.helpers.arrayElement(this.demoUsers.entities).getId(),
    ];

    note.date = faker.date.past({ years: 1 });

    this.removeFollowUpMarkerForOldNotes(note);

    return note;
  }
}
