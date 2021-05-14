import { Injectable, Optional } from "@angular/core";
import { from, Observable, Subject } from "rxjs";
import { Child } from "./model/child";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { AttendanceMonth } from "../attendance/model/attendance-month";
import { Note } from "../notes/model/note";
import { EducationalMaterial } from "../educational-material/model/educational-material";
import { Aser } from "../aser/model/aser";
import { ChildSchoolRelation } from "./model/childSchoolRelation";
import { HealthCheck } from "../health-checkup/model/health-check";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { ChildPhotoService } from "./child-photo-service/child-photo.service";
import { LoadChildPhotoEntitySchemaDatatype } from "./child-photo-service/datatype-load-child-photo";
import moment, { Moment } from "moment";
import { LoggingService } from "../../core/logging/logging.service";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { QueryOptions } from "../../core/database/database";
import { groupBy } from "../../utils/utils";

@Injectable()
export class ChildrenService {
  constructor(
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService,
    private dbIndexing: DatabaseIndexingService,
    @Optional() childPhotoService: ChildPhotoService,
    @Optional() private logger: LoggingService
  ) {
    if (childPhotoService) {
      this.entitySchemaService.registerSchemaDatatype(
        new LoadChildPhotoEntitySchemaDatatype(childPhotoService)
      );
    }
    this.createDatabaseIndices();
  }

  public createDatabaseIndices() {
    this.createAttendanceAnalysisIndex();
    this.createNotesIndex();
    this.createAttendancesIndex();
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
        const childCurrentSchoolInfo = await this.getCurrentSchoolInfoForChild(
          loadedChild.getId()
        );
        loadedChild.schoolClass = childCurrentSchoolInfo.schoolClass || "";
        loadedChild.schoolId = childCurrentSchoolInfo.schoolId || "";
      }
      results.next(loadedChildren);
      results.complete();
    });
    return results;
  }

  async getChildrenImproved(): Promise<Child[]> {
    const children = await this.entityMapper.loadType(Child);
    const allRelations = await this.entityMapper.loadType(ChildSchoolRelation);
    const relationsMap = groupBy(allRelations, "childId");
    children.forEach((child) => {
      const activeRelation = relationsMap
        .get(child.getId())
        .find((relation) => relation.isActive);
      if (activeRelation) {
        child.schoolId = activeRelation.schoolId;
        child.schoolClass = activeRelation.schoolClass;
      }
    });
    return children;
  }

  /**
   * returns an observable which retrieves a single child and loads its photo
   * @param id id of child
   */
  getChild(id: string): Observable<Child> {
    const promise = this.entityMapper
      .load<Child>(Child, id)
      .then((loadedChild) => {
        return this.getCurrentSchoolInfoForChild(id).then(
          (currentSchoolInfo) => {
            loadedChild.schoolClass = currentSchoolInfo.schoolClass;
            loadedChild.schoolId = currentSchoolInfo.schoolId;
            return loadedChild;
          }
        );
      });
    return from(promise);
  }

  getAttendances(): Observable<AttendanceMonth[]> {
    return from(this.entityMapper.loadType<AttendanceMonth>(AttendanceMonth));
  }

  getAttendancesOfChild(childId: string): Observable<AttendanceMonth[]> {
    const promise = this.dbIndexing.queryIndexDocs(
      AttendanceMonth,
      "attendances_index/by_child",
      childId
    );

    return from(promise);
  }

  getAttendancesOfMonth(month: Date): Observable<AttendanceMonth[]> {
    const monthString =
      month.getFullYear().toString() + "-" + (month.getMonth() + 1).toString();
    const promise = this.dbIndexing.queryIndexDocs(
      AttendanceMonth,
      "attendances_index/by_month",
      monthString
    );

    return from(promise);
  }

  /**
   * @deprecated use AttendanceService instead. This can be removed after all AttendanceMigrationService tasks are completed.
   * @private
   */
  private createAttendancesIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/attendances_index",
      views: {
        by_child: {
          map:
            "(doc) => { " +
            'if (!doc._id.startsWith("' +
            AttendanceMonth.ENTITY_TYPE +
            '")) return;' +
            "emit(doc.student); " +
            "}",
        },
        by_month: {
          map:
            "(doc) => { " +
            'if (!doc._id.startsWith("' +
            AttendanceMonth.ENTITY_TYPE +
            '")) return;' +
            "emit(doc.month); " +
            "}",
        },
      },
    };

    return this.dbIndexing.createIndex(designDoc);
  }

  private createChildSchoolRelationIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/childSchoolRelations_index",
      views: {
        by_child: {
          map: `(doc) => {
            if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) return;
            emit(doc.childId);
            }`,
        },
        by_school: {
          map: `(doc) => {
            if ( (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) ||
                (doc.start && isAfterToday(new Date(doc.start))) ||
                (doc.end && !isAfterToday(new Date(doc.end))) ) {
              return;
            }
            emit(doc.schoolId);
            function isAfterToday(date) {
              const tomorrow = new Date();
              tomorrow.setHours(0, 0, 0, 0);
              tomorrow.setDate(tomorrow.getDate() + 1);
              return date >= tomorrow;
            }
            }`,
        },
        by_date: {
          map: `(doc) => {
            if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) return;
            let timestamp = (new Date(doc.start || '3000-01-01')).getTime().toString().padStart(14, "0");
            emit(doc.childId + '_' + timestamp);
            }`,
        },
      },
    };
    return this.dbIndexing.createIndex(designDoc);
  }

  queryLatestRelation(childId: string): Promise<ChildSchoolRelation> {
    return this.querySortedRelations(childId, 1).then(
      (children) => children[0]
    );
  }

  async querySortedRelations(
    childId: string,
    limit?: number
  ): Promise<ChildSchoolRelation[]> {
    const options: QueryOptions = {
      startkey: childId + "_\uffff", //  higher value needs to be startkey
      endkey: childId + "_", //  \uffff is not a character -> only relations staring with childId will be selected
      descending: true,
      include_docs: true,
      limit: limit,
    };
    return this.dbIndexing.queryIndexDocs(
      ChildSchoolRelation,
      "childSchoolRelations_index/by_date",
      options
    );
  }

  async queryRelationsOf(
    queryType: "child" | "school",
    id: string
  ): Promise<ChildSchoolRelation[]> {
    return this.dbIndexing.queryIndexDocs(
      ChildSchoolRelation,
      "childSchoolRelations_index/by_" + queryType,
      id
    );
  }

  async queryAttendanceLast3Months() {
    return this.dbIndexing.queryIndexStats("avg_attendance_index/three_months");
  }

  async queryAttendanceLastMonth() {
    return this.dbIndexing.queryIndexStats("avg_attendance_index/last_month");
  }

  private createAttendanceAnalysisIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/avg_attendance_index",
      views: {
        three_months: {
          map: this.getAverageAttendanceMapFunction(),
          reduce: "_stats",
        },
        last_month: {
          map: this.getLastAverageAttendanceMapFunction(),
          reduce: "_stats",
        },
      },
    };

    return this.dbIndexing.createIndex(designDoc);
  }

  private getAverageAttendanceMapFunction() {
    return (
      "(doc) => {" +
      'if (!doc._id.startsWith("AttendanceMonth:") ) { return; }' +
      "if (!isWithinLast3Months(new Date(doc.month), new Date())) { return; }" +
      "var attendance = (doc.daysAttended / (doc.daysWorking - doc.daysExcused));" +
      "if (!Number.isNaN(attendance)) { emit(doc.student, attendance); }" +
      "function isWithinLast3Months(date, now) {" +
      "  let months;" +
      "  months = (now.getFullYear() - date.getFullYear()) * 12;" +
      "  months -= date.getMonth();" +
      "  months += now.getMonth();" +
      "  if (months < 0) { return false; }" +
      "  return months <= 3;" +
      "}" +
      "}"
    );
  }

  private getLastAverageAttendanceMapFunction() {
    return (
      "(doc) => {" +
      'if (!doc._id.startsWith("AttendanceMonth:")) { return; }' +
      "if (!isWithinLastMonth(new Date(doc.month), new Date())) { return; }" +
      "var attendance = (doc.daysAttended / (doc.daysWorking - doc.daysExcused));" +
      "if (!Number.isNaN(attendance)) { emit(doc.student, attendance); }" +
      "function isWithinLastMonth(date, now) {" +
      "  let months;" +
      "  months = (now.getFullYear() - date.getFullYear()) * 12;" +
      "  months -= date.getMonth();" +
      "  months += now.getMonth();" +
      "  return months === 1;" +
      "}" +
      "}"
    );
  }

  getNotesOfChild(childId: string): Observable<Note[]> {
    const promise = this.dbIndexing.queryIndexDocs(
      Note,
      "notes_index/by_child",
      childId
    );

    return from(promise);
  }

  /**
   * Query how many days ago the last note for each child was added.
   *
   * Warning: Children without any notes will be missing from this map.
   *
   * @param forLastNDays (Optional) cut-off boundary how many days into the past the analysis will be done.
   * @return A map of childIds as key and days since last note as value;
   *         For performance reasons the days since last note are set to infinity when larger then the forLastNDays parameter
   */
  public async getDaysSinceLastNoteOfEachChild(
    forLastNDays: number = 30
  ): Promise<Map<string, number>> {
    const startDay = moment().subtract(forLastNDays, "days");

    const notes = await this.getNotesInTimespan(startDay);

    const results = new Map();
    const children = await this.entityMapper.loadType(Child);
    children
      .filter((c) => c.isActive)
      .forEach((c) => results.set(c.getId(), Number.POSITIVE_INFINITY));

    for (const note of notes) {
      // TODO: filter notes to only include them if the given child is marked "present"

      for (const childId of note.children) {
        const daysSinceNote = moment().diff(note.date, "days");
        const previousValue = results.get(childId);
        if (previousValue > daysSinceNote) {
          results.set(childId, daysSinceNote);
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

  private createNotesIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/notes_index",
      views: {
        by_child: {
          map:
            "(doc) => { " +
            'if (!doc._id.startsWith("' +
            Note.ENTITY_TYPE +
            '")) return;' +
            "if (!Array.isArray(doc.children)) return;" +
            "doc.children.forEach(childId => emit(childId)); " +
            "}",
        },
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

    return this.dbIndexing.createIndex(designDoc);
  }

  getEducationalMaterialsOfChild(
    childId: string
  ): Observable<EducationalMaterial[]> {
    return from(
      this.entityMapper
        .loadType<EducationalMaterial>(EducationalMaterial)
        .then((loadedEntities) => {
          return loadedEntities.filter((o) => o.child === childId);
        })
    );
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

  async getCurrentSchoolInfoForChild(
    childId: string
  ): Promise<{ schoolId: string; schoolClass: string }> {
    const relations = (await this.querySortedRelations(childId)) || [];
    for (const rel of relations) {
      if (
        moment(rel.start).isSameOrBefore(moment(), "days") &&
        moment(rel.end).isSameOrAfter(moment(), "days")
      ) {
        return {
          schoolId: rel.schoolId,
          schoolClass: rel.schoolClass,
        };
      }
    }

    return {
      schoolId: null,
      schoolClass: null,
    };
  }

  async getSchoolsWithRelations(
    childId: string
  ): Promise<ChildSchoolRelation[]> {
    return await this.querySortedRelations(childId);
  }
}
