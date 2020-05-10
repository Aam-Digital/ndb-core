import { Injectable } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { Child } from './model/child';
import { EntityMapperService } from '../../core/entity/entity-mapper.service';
import { AttendanceMonth } from '../attendance/model/attendance-month';
import { Database } from '../../core/database/database';
import { Note } from '../notes/model/note';
import { EducationalMaterial } from '../educational-material/model/educational-material';
import { Aser } from '../aser/model/aser';
import { ChildSchoolRelation } from './model/childSchoolRelation';
import { HealthCheck } from '../health-checkup/model/health-check';
import { EntitySchemaService } from '../../core/entity/schema/entity-schema.service';
import { ChildPhotoService } from './child-photo-service/child-photo.service';
import { LoadChildPhotoEntitySchemaDatatype } from './child-photo-service/datatype-load-child-photo';
import moment from 'moment';
import * as uniqid from 'uniqid';
import { LoggingService } from '../../core/logging/logging.service';

@Injectable()
export class ChildrenService {

  constructor(private entityMapper: EntityMapperService,
              private entitySchemaService: EntitySchemaService,
              private db: Database,
              childPhotoService: ChildPhotoService,
              private logger: LoggingService,
  ) {
    this.entitySchemaService.registerSchemaDatatype(new LoadChildPhotoEntitySchemaDatatype(childPhotoService));
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

    this.entityMapper.loadType<Child>(Child)
    .then(async (loadedChildren) => {
      results.next(loadedChildren);

      for (const loadedChild of loadedChildren) {
        const childCurrentSchoolInfo = await this.getCurrentSchoolInfoForChild(loadedChild.getId());
        await this.migrateToNewChildSchoolRelationModel(loadedChild, childCurrentSchoolInfo);
        loadedChild.schoolClass = childCurrentSchoolInfo.schoolClass;
        loadedChild.schoolId = childCurrentSchoolInfo.schoolId;
      }
      results.next(loadedChildren);
    });

    return results;
  }

  /**
   * DATA MODEL UPGRADE
   * Check if the Child Entity still contains direct links to schoolId and schoolClass
   * and create a new ChildSchoolRelation if necessary.
   * @param loadedChild Child entity to be checked and migrated
   * @param childCurrentSchoolInfo Currently available school information according to new data model from ChildSchoolRelation entities
   */
  private async migrateToNewChildSchoolRelationModel(
    loadedChild: Child,
    childCurrentSchoolInfo: { schoolId: string; schoolClass: string },
  ) {
    if (!loadedChild.schoolClass && !loadedChild.schoolId) {
      // no data from old model -> skip migration
      return;
    }

    if (loadedChild.schoolId !== childCurrentSchoolInfo.schoolId || loadedChild.schoolClass !== childCurrentSchoolInfo.schoolClass) {
      // generate a ChildSchoolRelation entity from the information of the previous data model
      const autoMigratedChildSchoolRelation = new ChildSchoolRelation(uniqid());
      autoMigratedChildSchoolRelation.childId = loadedChild.getId();
      autoMigratedChildSchoolRelation.schoolId = loadedChild.schoolId;
      autoMigratedChildSchoolRelation.schoolClass = loadedChild.schoolClass;
      await this.entityMapper.save(autoMigratedChildSchoolRelation);
      this.logger.debug('migrated Child entity to new ChildSchoolRelation model ' + loadedChild._id);
      console.log(autoMigratedChildSchoolRelation);
    }

    // save the Child entity to remove the deprecated attributes from the doc in the database
    await this.entityMapper.save(loadedChild);
  }

  /**
   * returns an observable which retrieves a single child and loads its photo
   * @param id id of child
   */
  getChild(id: string): Observable<Child> {
    const promise = this.entityMapper.load<Child>(Child, id)
      .then(loadedChild => {
        return (this.getCurrentSchoolInfoForChild(id))
          .then(currentSchoolInfo => {
            loadedChild.schoolClass = currentSchoolInfo.schoolClass;
            loadedChild.schoolId = currentSchoolInfo.schoolId;
            return (loadedChild);
          });
      });
    return from(promise);
  }

  getAttendances(): Observable<AttendanceMonth[]> {
    return from(this.entityMapper.loadType<AttendanceMonth>(AttendanceMonth));
  }

  getAttendancesOfChild(childId: string): Observable<AttendanceMonth[]> {
    const promise = this.db.query('attendances_index/by_child', {key: childId, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new AttendanceMonth('');
          this.entitySchemaService.loadDataIntoEntity(entity, loadedRecord.doc);
          return entity;
        });
      });

    return from(promise);
  }

  getAttendancesOfMonth(month: Date): Observable<AttendanceMonth[]> {
    const monthString = month.getFullYear().toString() + '-' + (month.getMonth() + 1).toString();
    const promise = this.db.query('attendances_index/by_month', {key: monthString, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new AttendanceMonth('');
          this.entitySchemaService.loadDataIntoEntity(entity, loadedRecord.doc);
          return entity;
        });
      });

    return from(promise);
  }

  private createAttendancesIndex(): Promise<any> {
    const designDoc = {
      _id: '_design/attendances_index',
      views: {
        by_child: {
          map: '(doc) => { ' +
            'if (!doc._id.startsWith("' + AttendanceMonth.ENTITY_TYPE + '")) return;' +
            'emit(doc.student); ' +
            '}',
        },
        by_month: {
          map: '(doc) => { ' +
            'if (!doc._id.startsWith("' + AttendanceMonth.ENTITY_TYPE + '")) return;' +
            'emit(doc.month); ' +
            '}',
        },
      },
    };

    return this.db.saveDatabaseIndex(designDoc);
  }

  private createChildSchoolRelationIndex(): Promise<any> {
    const designDoc = {
      _id: '_design/childSchoolRelations_index',
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
                (doc.start && (new Date(doc.start) > new Date().setHours(0, 0, 0, 0))) ||
                (doc.end && (new Date(doc.end) < new Date().setHours(0, 0, 0, 0))) ) {
              return;
            }
            emit(doc.schoolId);
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
    return this.db.saveDatabaseIndex(designDoc);
  }

  queryLatestRelation(childId: string): Promise<ChildSchoolRelation> {
    return this.querySortedRelations(childId, 1).then(children => children[0]);
 }

  querySortedRelations(childId: string, limit?: number): Promise<ChildSchoolRelation[]> {
    const options: any = {
      startkey: childId + '_\uffff', //  higher value needs to be startkey
      endkey: childId + '_',              //  \uffff is not a character -> only relations staring with childId will be selected
      descending: true,
      include_docs: true,
      limit: limit,
    };
    return this.db.query(
      'childSchoolRelations_index/by_date',
      options,
    )
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new ChildSchoolRelation('');
          this.entitySchemaService.loadDataIntoEntity(entity, loadedRecord.doc);
          return entity;
        });
      });
 }

  queryRelationsOf(queryType: 'child' | 'school', id: string): Promise<ChildSchoolRelation[]> {
    return this.db.query('childSchoolRelations_index/by_' + queryType, {key: id, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new ChildSchoolRelation('');
          this.entitySchemaService.loadDataIntoEntity(entity, loadedRecord.doc);
          return entity;
        });
      });
  }

  queryAttendanceLast3Months() {
    return this.db.query('avg_attendance_index/three_months', {reduce: true, group: true});
  }

  queryAttendanceLastMonth() {
    return this.db.query('avg_attendance_index/last_month', {reduce: true, group: true});
  }


  private createAttendanceAnalysisIndex(): Promise<any> {
    const designDoc = {
      _id: '_design/avg_attendance_index',
      views: {
        three_months: {
          map: this.getAverageAttendanceMapFunction(),
          reduce: '_stats',
        },
        last_month: {
          map: this.getLastAverageAttendanceMapFunction(),
          reduce: '_stats',
        },
      },
    };

    return this.db.saveDatabaseIndex(designDoc);
  }


  private getAverageAttendanceMapFunction () {
    return '(doc) => {' +
      'if (!doc._id.startsWith("AttendanceMonth:") ) { return; }' +
      'if (!isWithinLast3Months(new Date(doc.month), new Date())) { return; }' +
      'var attendance = (doc.daysAttended / (doc.daysWorking - doc.daysExcused));' +
      'if (!isNaN(attendance)) { emit(doc.student, attendance); }' +
      'function isWithinLast3Months(date, now) {' +
      '  let months;' +
      '  months = (now.getFullYear() - date.getFullYear()) * 12;' +
      '  months -= date.getMonth();' +
      '  months += now.getMonth();' +
      '  if (months < 0) { return false; }' +
      '  return months <= 3;' +
      '}' +
      '}';
  }

  private getLastAverageAttendanceMapFunction () {
    return '(doc) => {' +
      'if (!doc._id.startsWith("AttendanceMonth:")) { return; }' +
      'if (!isWithinLastMonth(new Date(doc.month), new Date())) { return; }' +
      'var attendance = (doc.daysAttended / (doc.daysWorking - doc.daysExcused));' +
      'if (!isNaN(attendance)) { emit(doc.student, attendance); }' +
      'function isWithinLastMonth(date, now) {' +
      '  let months;' +
      '  months = (now.getFullYear() - date.getFullYear()) * 12;' +
      '  months -= date.getMonth();' +
      '  months += now.getMonth();' +
      '  return months === 1;' +
      '}' +
      '}';
  }

  getNotesOfChild(childId: string): Observable<Note[]> {
    const promise = this.db.query('notes_index/by_child', {key: childId, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new Note('');
          this.entitySchemaService.loadDataIntoEntity(entity, loadedRecord.doc);
          return entity;
        });
      });

    return from(promise);
  }

  /**
   * Query how many days ago the last note for each child was added.
   *
   * Warning: Children without any notes will be missing from this map.
   *
   * @return A map of childIds as key and days since last note as value
   */
  public async getDaysSinceLastNoteOfEachChild(): Promise<Map<string, number>> {
    const stats = await this.db
      .query('notes_index/note_date_in_days_for_child', {reduce: true, group: true});

    const results = new Map();
    for (const childStats of stats.rows) {
      const dateOfLatestNoteInDays = childStats.value.max;
      const todayInDays = (new Date()).getTime() / 86400000; // ms/day: 1000*60*60*24 = 86400000
      const daysSinceLastNote = (todayInDays - dateOfLatestNoteInDays);
      results.set(childStats.key, daysSinceLastNote);
    }

    return results;
  }

  private createNotesIndex(): Promise<any> {
    const designDoc = {
      _id: '_design/notes_index',
      views: {
        by_child: {
          map: '(doc) => { ' +
            'if (!doc._id.startsWith("' + Note.ENTITY_TYPE + '")) return;' +
            'if (!Array.isArray(doc.children)) return;' +
            'doc.children.forEach(childId => emit(childId)); ' +
            '}',
        },
        note_date_in_days_for_child: {
          map: '(doc) => { ' +
            'if (!doc._id.startsWith("' + Note.ENTITY_TYPE + '")) return;' +
            'if (!Array.isArray(doc.children) || !doc.date) return;' +
            'doc.children.forEach(childId => emit(childId, (new Date(doc.date)).getTime()/86400000)); ' + // ms/day: 1000*60*60*24 = 86400000
            '}',
          reduce: '_stats',
        },
      },
    };

    return this.db.saveDatabaseIndex(designDoc);
  }

  getEducationalMaterialsOfChild(childId: string): Observable<EducationalMaterial[]> {
    return from(
      this.entityMapper.loadType<EducationalMaterial>(EducationalMaterial)
        .then(loadedEntities => {
          return loadedEntities.filter(o => o.child === childId);
        }),
    );
  }

  /**
   *
   * @param childId should be set in the specific components and is passed by the URL as a parameter
   * This function should be considered refactored and should use a index, once they're made generic
   */
  getHealthChecksOfChild(childId: string): Observable<HealthCheck[]> {
    return from(
      this.entityMapper.loadType<HealthCheck>(HealthCheck)
      .then(loadedEntities => {
        return loadedEntities.filter(h => h.child === childId);
      }),
    );
  }

  getAserResultsOfChild(childId: string): Observable<Aser[]> {
    return from(
      this.entityMapper.loadType<Aser>(Aser)
        .then(loadedEntities => {
          return loadedEntities.filter(o => o.child === childId);
        }),
    );
  }

  async getCurrentSchoolInfoForChild(childId: string): Promise<{schoolId: string, schoolClass: string}> {
    const relations = (await this.querySortedRelations(childId)) || [];
    for (const rel of relations) {
      if (moment(rel.start).isSameOrBefore(moment(), 'days')
        && moment(rel.end).isSameOrAfter(moment(), 'days')) {
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

  async getSchoolsWithRelations(childId: string): Promise<ChildSchoolRelation[]> {
    return await this.querySortedRelations(childId);
  }
}
