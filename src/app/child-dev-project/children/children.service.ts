import { Injectable, Optional } from "@angular/core";
import { from, Observable, Subject } from "rxjs";
import { Child } from "./model/child";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { Note } from "../notes/model/note";
import { Aser } from "./aser/model/aser";
import { ChildSchoolRelation } from "./model/childSchoolRelation";
import { HealthCheck } from "./health-checkup/model/health-check";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { ChildPhotoService } from "./child-photo-service/child-photo.service";
import moment, { Moment } from "moment";
import { LoggingService } from "../../core/logging/logging.service";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { Entity } from "../../core/entity/model/entity";
import { School } from "../schools/model/school";
import { User } from "../../core/user/user";

@Injectable({ providedIn: "root" })
export class ChildrenService {
  constructor(
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService,
    private dbIndexing: DatabaseIndexingService,
    @Optional() childPhotoService: ChildPhotoService,
    @Optional() private logger: LoggingService
  ) {
    this.createDatabaseIndices();
  }

  public createDatabaseIndices() {
    this.createNotesIndex();
    this.createChildSchoolRelationIndex();
  }

  /**
   * returns an observable which retrieves children from the database and loads their pictures
   */
  getChildren(): Observable<Child[]> {
    const results = new Subject<Child[]>();

    this.entityMapper.loadType<Child>(Child).then(async (loadedChildren) => {
      results.next(loadedChildren);

      for (const loadedChild of loadedChildren) {
        const childCurrentSchoolInfo = await this.queryLatestRelation(
          loadedChild.getId()
        );
        loadedChild.schoolClass = childCurrentSchoolInfo?.schoolClass;
        loadedChild.schoolId = childCurrentSchoolInfo?.schoolId;
      }
      results.next([...loadedChildren]);
      results.complete();
    });

    return results;
  }

  /**
   * returns an observable which retrieves a single child and loads its photo
   * @param id id of child
   */
  getChild(id: string): Promise<Child> {
    return this.entityMapper.load<Child>(Child, id).then((loadedChild) => {
      return this.queryLatestRelation(id).then((currentSchoolInfo) => {
        loadedChild.schoolClass = currentSchoolInfo?.schoolClass;
        loadedChild.schoolId = currentSchoolInfo?.schoolId;
        return loadedChild;
      });
    });
  }

  private createChildSchoolRelationIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/childSchoolRelations_index",
      views: {
        by_child: {
          map: `(doc) => {
            if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) return;
            emit([doc.childId, new Date(doc.start || '3000-01-01').getTime()]);
          }`,
        },
        by_school: {
          map: `(doc) => {
            if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) return;
            emit([doc.schoolId]);
            }`,
        },
      },
    };
    return this.dbIndexing.createIndex(designDoc);
  }

  queryLatestRelation(
    childId: string
  ): Promise<ChildSchoolRelation | undefined> {
    return this.queryActiveRelationsOf("child", childId).then((relations) =>
      relations.length > 0 ? relations[0] : undefined
    );
  }

  queryActiveRelationsOf(
    queryType: "child" | "school",
    id: string,
    date = new Date()
  ): Promise<ChildSchoolRelation[]> {
    return this.queryRelationsOf(queryType, id).then((relations) =>
      relations.filter((rel) => rel.isActiveAt(date))
    );
  }

  queryRelationsOf(
    queryType: "child" | "school",
    id: string
  ): Promise<ChildSchoolRelation[]> {
    return this.dbIndexing.queryIndexDocs(
      ChildSchoolRelation,
      "childSchoolRelations_index/by_" + queryType,
      {
        startkey: [id, "\uffff"],
        endkey: [id],
        descending: true,
      }
    );
  }

  /**
   * Query all notes that have been linked to the given other entity.
   * @param entityId ID (with prefix!) of the related record
   */
  async getNotesRelatedTo(entityId: string): Promise<Note[]> {
    let legacyLinkedNotes = [];
    if (this.inferNoteLinkPropertyFromEntityType(entityId)) {
      legacyLinkedNotes = await this.dbIndexing.queryIndexDocs(
        Note,
        `notes_index/by_${this.inferNoteLinkPropertyFromEntityType(entityId)}`,
        Entity.extractEntityIdFromId(entityId)
      );
    }

    const explicitlyLinkedNotes = await this.dbIndexing.queryIndexDocsRange(
      Note,
      `notes_related_index/note_by_relatedEntities`,
      [entityId],
      [entityId]
    );

    return [...legacyLinkedNotes, ...explicitlyLinkedNotes].filter(
      // remove duplicates
      (element, index, array) =>
        array.findIndex((e) => e._id === element._id) === index
    );
  }

  private inferNoteLinkPropertyFromEntityType(entityId: string): string {
    const entityType = Entity.extractTypeFromId(entityId);
    switch (entityType) {
      case Child.ENTITY_TYPE:
        return "children";
      case School.ENTITY_TYPE:
        return "schools";
      case User.ENTITY_TYPE:
        return "authors";
    }
  }

  /**
   * Query how many days ago the last note for each child was added.
   *
   * Warning: Children without any notes will be missing from this map.
   *
   * @param entityType (Optional) entity for which days since last note are calculated. Default "Child".
   * @param forLastNDays (Optional) cut-off boundary how many days into the past the analysis will be done.
   * @return A map of childIds as key and days since last note as value;
   *         For performance reasons the days since last note are set to infinity when larger then the forLastNDays parameter
   */
  public async getDaysSinceLastNoteOfEachEntity(
    entityType = Child.ENTITY_TYPE,
    forLastNDays: number = 30
  ): Promise<Map<string, number>> {
    const startDay = moment().subtract(forLastNDays, "days");

    const notes = await this.getNotesInTimespan(startDay);

    const results = new Map();
    const entities = await this.entityMapper.loadType(entityType);
    entities
      .filter((c) => c.isActive)
      .forEach((c) => results.set(c.getId(), Number.POSITIVE_INFINITY));

    const noteProperty = Note.getPropertyFor(entityType);
    for (const note of notes) {
      // TODO: filter notes to only include them if the given child is marked "present"

      for (const entityId of note[noteProperty]) {
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
    endDay: Date | Moment = moment()
  ): Promise<Note[]> {
    return this.dbIndexing.queryIndexDocsRange(
      Note,
      "notes_index/note_child_by_date",
      moment(startDay).format("YYYY-MM-DD"),
      moment(endDay).format("YYYY-MM-DD")
    );
  }

  private async createNotesIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/notes_index",
      views: {
        note_child_by_date: {
          map: `(doc) => {
            if (!doc._id.startsWith("${Note.ENTITY_TYPE}")) return;
            if (!Array.isArray(doc.children) || !doc.date) return;
            var d = new Date(doc.date || null);
            var dString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
            emit(dString);
          }`,
        },
      },
    };

    // TODO: remove these and use general note_by_relatedEntities instead --> to be decided later #1501
    // creating a by_... view for each of the following properties
    ["children", "schools", "authors"].forEach(
      (prop) =>
        (designDoc.views[`by_${prop}`] = this.createNotesByFunction(prop))
    );

    await this.dbIndexing.createIndex(designDoc);

    const newDesignDoc = {
      _id: "_design/notes_related_index",
      views: {
        note_by_relatedEntities: {
          map: `(doc) => {
            if (!doc._id.startsWith("${Note.ENTITY_TYPE}")) return;
            if (!Array.isArray(doc.relatedEntities)) return;

            var d = new Date(doc.date || null);
            var dateString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")

            doc.relatedEntities.forEach((relatedEntity) => {
              emit([relatedEntity, dateString]);
            });
          }`,
        },
      },
    };
    await this.dbIndexing.createIndex(newDesignDoc);
  }

  private createNotesByFunction(property: string) {
    return {
      map: `(doc) => {
        if (!doc._id.startsWith("${Note.ENTITY_TYPE}")) return;
        if (!Array.isArray(doc.${property})) return;
        doc.${property}.forEach(val => emit(val));
      }`,
    };
  }

  /**
   *
   * @param childId should be set in the specific components and is passed by the URL as a parameter
   * This function should be considered refactored and should use a index, once they're made generic
   */
  getHealthChecksOfChild(childId: string): Observable<HealthCheck[]> {
    return from(
      this.entityMapper
        .loadType<HealthCheck>(HealthCheck)
        .then((loadedEntities) => {
          return loadedEntities.filter((h) => h.child === childId);
        })
    );
  }

  getAserResultsOfChild(childId: string): Observable<Aser[]> {
    return from(
      this.entityMapper.loadType<Aser>(Aser).then((loadedEntities) => {
        return loadedEntities.filter((o) => o.child === childId);
      })
    );
  }
}
