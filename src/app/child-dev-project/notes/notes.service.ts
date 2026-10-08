import { Injectable, inject } from "@angular/core";
import moment, { Moment } from "moment";
import { EMPTY, from } from "rxjs";
import {
  catchError,
  concatMap,
  distinctUntilChanged,
  map,
} from "rxjs/operators";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { EntityConfigReadyService } from "../../core/entity/entity-config-ready.service";
import { Logging } from "../../core/logging/logging.service";
import { Note } from "./model/note";

/**
 * Index view of notes by their `authors` (query key: the author's entity ID).
 *
 * Currently not registered in the `notes_index` design doc, because nothing queries it
 * and every registered view has to be built on each device.
 */
export const NOTES_BY_AUTHORS_VIEW = {
  map: `(doc) => {
    if (!doc._id.startsWith("${Note.ENTITY_TYPE}")) return;
    if (!Array.isArray(doc.authors)) return;
    doc.authors.forEach(val => emit(val));
  }`,
};

/**
 * Queries for {@link Note} records, backed by database indices that this service sets up.
 */
@Injectable({ providedIn: "root" })
export class NotesService {
  private entityMapper = inject(EntityMapperService);
  private dbIndexing = inject(DatabaseIndexingService);
  private entityConfigReady = inject(EntityConfigReadyService);

  constructor() {
    this.createNotesIndex();

    // the linked fields of notes depend on the (config-extended) Note schema,
    // so (re-)build the index only once config-defined fields have been applied
    this.entityConfigReady.setupCompleted$
      .pipe(
        map(() => Note.getLinkFields()),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
        ),
        concatMap((linkFields) =>
          from(this.createNotesRelatedIndex(linkFields)).pipe(
            catchError((error) => {
              Logging.error("Failed to create notes related index", error);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe();
  }

  /**
   * Query all notes that have been linked to the given other entity
   * (through any of its entity fields, see {@link Note.getLinkFields}).
   * This does not include notes the given entity is one of the `authors` of.
   * @param entityId ID (with prefix!) of the related record
   */
  async getNotesRelatedTo(entityId: string): Promise<Note[]> {
    const notes = await this.dbIndexing.queryIndexDocsRange(
      Note,
      `notes_related_index/related_entities`,
      [entityId],
      [entityId],
    );

    // a note linking the same entity in multiple fields is returned more than once
    return notes.filter(
      (element, index, array) =>
        array.findIndex((e) => e.getId() === element.getId()) === index,
    );
  }

  /**
   * Query how many days ago the last note for each child was added.
   *
   * Warning: Children without any notes will be missing from this map.
   *
   * @param entityType entity for which days since last note are calculated
   * @param forLastNDays (Optional) cut-off boundary how many days into the past the analysis will be done.
   * @return A map of childIds as key and days since last note as value;
   *         For performance reasons the days since last note are set to infinity when larger then the forLastNDays parameter
   */
  public async getDaysSinceLastNoteOfEachEntity(
    entityType: string,
    forLastNDays: number = 30,
  ): Promise<Map<string, number>> {
    const startDay = moment().subtract(forLastNDays, "days");

    const notes = await this.getNotesInTimespan(startDay);

    const results = new Map();
    const entities = await this.entityMapper.loadType(entityType);
    entities
      .filter((c) => !c.inactive)
      .forEach((c) => results.set(c.getId(), Number.POSITIVE_INFINITY));

    const linkFields = Note.getLinkFields();
    for (const note of notes) {
      // TODO: filter notes to only include them if the given child is marked "present"

      // ids of other entity types are ignored, as they are not in the results map
      const linkedIds = linkFields.flatMap((field) => note[field] ?? []);
      for (const entityId of linkedIds) {
        const daysSinceNote = moment().diff(note.date, "days");
        const previousValue = results.get(entityId);
        if (previousValue > daysSinceNote) {
          results.set(entityId, daysSinceNote);
        }
      }
    }

    return results;
  }

  /**
   * Returns all notes in the timespan.
   * It is only checked if the notes are on the same day als start and end day. The time is not checked.
   * @param startDay the first day where notes should be included
   * @param endDay the last day where notes should be included
   */
  public async getNotesInTimespan(
    startDay: Date | Moment,
    endDay: Date | Moment = moment(),
  ): Promise<Note[]> {
    return this.dbIndexing.queryIndexDocsRange(
      Note,
      "notes_index/note_by_date",
      moment(startDay).format("YYYY-MM-DD"),
      moment(endDay).format("YYYY-MM-DD"),
    );
  }

  private async createNotesIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/notes_index",
      views: {
        note_by_date: {
          map: `(doc) => {
            if (!doc._id.startsWith("${Note.ENTITY_TYPE}")) return;
            if (!doc.date) return;
            if (doc.date.length === 10) {
              emit(doc.date);
            } else {
              var d = new Date(doc.date || null);
              emit(d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
            }
          }`,
        },
        // by_authors: NOTES_BY_AUTHORS_VIEW, // disabled for now, as nothing queries it
      },
    };

    await this.dbIndexing.createIndex(designDoc);
  }

  private async createNotesRelatedIndex(
    linkFields = Note.getLinkFields(),
  ): Promise<void> {
    const designDoc = {
      _id: "_design/notes_related_index",
      views: {
        related_entities: {
          map: `(doc) => {
            if (!doc._id.startsWith("${Note.ENTITY_TYPE}")) return;
            var dString;
            if (doc.date && doc.date.length === 10) {
              dString = doc.date;
            } else {
              var d = new Date(doc.date || null);
              dString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
            }
            ${JSON.stringify(linkFields)}.forEach((field) => {
              if (!doc[field]) return;
              [].concat(doc[field]).forEach((relatedEntity) => {
                emit([relatedEntity, dString]);
              });
            });
          }`,
        },
      },
    };
    await this.dbIndexing.createIndex(designDoc);
  }
}
