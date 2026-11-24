import { DemoEntityStore } from "#src/app/core/demo-data/generic/demo-entity-store";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { Injectable, inject } from "@angular/core";
import { Note } from "../model/note";
import { faker } from "../../../core/demo-data/faker";
import { noteIndividualStories } from "./notes_individual-stories";
import { noteGroupStories } from "./notes_group-stories";
import { DemoUserGeneratorService } from "../../../core/user/demo-user-generator.service";
import { warningLevels, WarningLevel } from "../../warning-level";
import { Entity } from "../../../core/entity/model/entity";
import { asArray } from "../../../utils/asArray";
import { admissionDateOf } from "#src/app/core/demo-data/participant-dates";

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
  private config = inject(DemoNoteConfig);
  private readonly demoEntities = inject(DemoEntityStore);
  private demoUsers = inject(DemoUserGeneratorService);
  private readonly enums = inject(ConfigurableEnumService);

  override requiredEntityTypes = ["Note"];

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

  public generateEntities(): Note[] {
    const notes = generateNotes({
      children: this.demoEntities.get("Child"),
      authors: this.demoUsers.entities,
      minNotesPerChild: this.config.minNotesPerChild,
      maxNotesPerChild: this.config.maxNotesPerChild,
      groupNotes: this.config.groupNotes,
    });

    this.dropLinksTheUseCaseDoesNotAllow(notes);
    this.applyConfiguredCategories(notes);
    return notes;
  }

  /**
   * A story relates its note to a participant through the field the education
   * use case has for it. Another use case may point that field at something else
   * entirely, so drop a link it does not allow - the generic linking then fills
   * the field that does fit.
   */
  private dropLinksTheUseCaseDoesNotAllow(notes: Note[]) {
    if (!this.entityRegistry.has("Note")) {
      return;
    }

    for (const [fieldId, field] of this.entityRegistry.get("Note").schema) {
      const allowed =
        field.dataType === "entity"
          ? asArray(field.additional).filter(
              (type): type is string => typeof type === "string",
            )
          : [];
      if (allowed.length === 0) {
        continue;
      }

      for (const note of notes) {
        this.keepOnlyAllowedLinks(note, fieldId, field.isArray, allowed);
      }
    }
  }

  /** Drop the ids of a reference field whose type the use case does not allow there. */
  private keepOnlyAllowedLinks(
    note: Note,
    fieldId: string,
    isArray: boolean,
    allowed: string[],
  ): void {
    const record = note as unknown as Record<string, unknown>;
    if (record[fieldId] === undefined) {
      return;
    }

    const kept = asArray(record[fieldId]).filter(
      (id) =>
        typeof id === "string" &&
        allowed.includes(Entity.extractTypeFromId(id)),
    );
    if (kept.length === 0) {
      delete record[fieldId];
    } else {
      record[fieldId] = isArray ? kept : kept[0];
    }
  }

  /**
   * The stories carry the categories of the education use case. Any other use case
   * configures its own, which would otherwise show up as an invalid option.
   */
  private applyConfiguredCategories(notes: Note[]) {
    if (!this.entityRegistry.has("Note")) {
      return;
    }
    const field = this.entityRegistry.get("Note").schema.get("category");
    const options = this.enums.getEnumValues(field?.additional);
    if (options.length === 0) {
      return;
    }

    for (const note of notes) {
      const configured = options.some((o) => o.id === note.category?.id);
      if (!configured) {
        note.category = faker.helpers.arrayElement(options);
      }
    }
  }
}

export function generateNotes(params: {
  children: Entity[];
  authors: Entity[];
  minNotesPerChild: number;
  maxNotesPerChild: number;
  groupNotes: number;
}): Note[] {
  const notes = [];
  // a use case can have notes without any staff records to attribute them to
  const pickAuthor = () =>
    params.authors.length > 0
      ? faker.helpers.arrayElement(params.authors)
      : undefined;

  for (const child of params.children) {
    if (child.inactive) {
      continue;
    }

    let numberOfNotes = faker.number.int({
      min: params.minNotesPerChild,
      max: params.maxNotesPerChild,
    });

    // generate a recent note for the last week for some children to have data for dashboard
    if (numberOfNotes > 0 && faker.number.int(100) < 40) {
      notes.push(
        generateNote({
          child,
          author: pickAuthor(),
          date: faker.date.recent({ days: 6 }),
        }),
      );
      numberOfNotes--;
    }

    for (let i = 0; i < numberOfNotes; i++) {
      notes.push(
        generateNote({
          child,
          author: pickAuthor(),
        }),
      );
    }
  }

  // a random group of participants each: the demo schema has no field to group them by
  for (let i = 0; i < params.groupNotes; i++) {
    notes.push(
      generateGroupNote({
        children: faker.helpers.arrayElements(params.children, {
          min: 3,
          max: 12,
        }),
        author: pickAuthor(),
      }),
    );
  }

  return notes;
}

export function generateNote(params: {
  child: Entity;
  author?: Entity;
  date?: Date;
  warningLevel?: WarningLevel;
}): Note {
  const note = new Note(faker.string.uuid());

  const selectedStory = faker.helpers.arrayElement(noteIndividualStories);
  Object.assign(note, selectedStory);

  note.relatedEntities = [params.child.getId()];
  note.authors = params.author ? [params.author.getId()] : [];

  let date = params.date;
  if (!date) {
    date = faker.date.between({
      from: admissionDateOf(params.child),
      to: faker.getEarlierDateOrToday(params.child["dropoutDate"]),
    });
  }
  note.date = date;

  if (params.warningLevel) {
    note.warningLevel = warningLevels.find((l) => l.id === params.warningLevel);
  } else {
    removeFollowUpMarkerForOldNotes(note);
  }

  return note;
}

function generateGroupNote(params: { children: Entity[]; author?: Entity }) {
  const note = new Note();

  const selectedStory = faker.helpers.arrayElement(noteGroupStories);
  Object.assign(note, selectedStory);

  // attendance is no longer recorded on Note (see the `attendance` datatype
  // used by the demo Event / ClassSession entities instead)
  note.relatedEntities = params.children.map((c) => c.getId());

  note.authors = params.author ? [params.author.getId()] : [];

  note.date = faker.date.past({ years: 1 });

  removeFollowUpMarkerForOldNotes(note);

  return note;
}

/**
 * Set all older notes to be "resolved" in order to keep the list of notes needing follow-up limited in the demo.
 */
function removeFollowUpMarkerForOldNotes(note: Note) {
  const lastMonths = faker.defaultRefDate();
  lastMonths.setMonth(lastMonths.getMonth() - 1);
  if (note.date < lastMonths) {
    note.warningLevel = warningLevels.find((level) => level.id === "OK");
  }
}
