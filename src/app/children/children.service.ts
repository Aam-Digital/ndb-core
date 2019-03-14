import { Injectable } from '@angular/core';
import {from, Observable} from 'rxjs';
import {Child, ViewableSchool} from './child';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {AttendanceMonth} from './attendance/attendance-month';
import {Database} from '../database/database';
import {Note} from './notes/note';
import {EducationalMaterial} from './educational-material/educational-material';
import {Aser} from './aser/aser';
import {ChildSchoolRelation} from './childSchoolRelation';
import {School} from '../schools/school';
import {map} from 'rxjs/operators';

export class TableChild extends Child {
  public schoolId = '';
  public schoolClass = '';

  constructor(private _child?: Child, private _childSchoolRelation?: ChildSchoolRelation) {
    super(_child.getId());
    this.load(_child);
    this.schoolId = this._childSchoolRelation.schoolId;
    this.schoolClass = this._childSchoolRelation.class;
  }
}

@Injectable()
export class ChildrenService {

  constructor(private entityMapper: EntityMapperService,
              private db: Database) {
    this.createAttendanceAnalysisIndex();
    this.createNotesIndex();
    this.createAttendancesIndex();
    this.createChildSchoolRelationIndex()
  }

  async getChildrenForTable(): Promise<TableChild[]> {
    const children = await this.entityMapper.loadType<Child>(Child);
    const tableData: TableChild[] = [];
    for (const child of children) {
      const relation: ChildSchoolRelation = await this.queryLatestSchool(child.getId());
      console.log('relation', child, relation);
      tableData.push(new TableChild(child, relation));
    }
    return tableData;
  }

  getChildren(): Observable<Child[]> {
    return from(this.entityMapper.loadType<Child>(Child));
  }
  getChild(id: string): Observable<Child> {
    return from(this.entityMapper.load<Child>(Child, id));
  }

  getAttendances(): Observable<AttendanceMonth[]> {
    return from(this.entityMapper.loadType<AttendanceMonth>(AttendanceMonth));
  }

  getAttendancesOfChild(childId: string): Observable<AttendanceMonth[]> {
    const promise = this.db.query('attendances_index/by_child', {key: childId, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new AttendanceMonth('');
          entity.load(loadedRecord.doc);
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
          entity.load(loadedRecord.doc);
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
            '}'
        },
        by_month: {
          map: '(doc) => { ' +
            'if (!doc._id.startsWith("' + AttendanceMonth.ENTITY_TYPE + '")) return;' +
            'emit(doc.month); ' +
            '}'
        }
      }
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
            }`
        },
        by_school: {
          map: `(doc) => {
            if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) return;
            emit(doc.schoolId);
            }`
        },
        by_date: {
          map: `(doc) => {
            if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) return;
            emit(doc.childId + (new Date(doc.start)).getTime());
            }`
        }

      }
    };
    return this.db.saveDatabaseIndex(designDoc);
  }

  queryLatestSchool(childId: string): Promise<ChildSchoolRelation> {
    return this.db.query(
      'childSchoolRelations_index/by_date',
      {
        startkey: childId + '\uffff', //  higher value needs to be startkey
        endkey: childId,              //  \uffff is not a character -> only relations staring with childId will be selected
        limit: 1,                     //  only return first one because that is the latest starting date -> current one?
        descending: true,
        include_docs: true
      }
    )
      .then(result => {
        let entity: ChildSchoolRelation = null;
        const records = result.rows;
        if (records) {
          entity = new ChildSchoolRelation('');
          entity.load(records[0].doc);
          }
        return entity;
      });
 }

  querySchoolsOfChild(childId: string): Observable<ChildSchoolRelation[]> {
    const promise = this.db.query('childSchoolRelations_index/by_child', {key: childId, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new ChildSchoolRelation('');
          entity.load(loadedRecord.doc);
          return entity;
        });
      });

    return from(promise);
  }

  queryChildrenofSchool(schoolId: string) {
    const promise = this.db.query('childSchoolRelations_index/by_school', {key: schoolId, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new ChildSchoolRelation('');
          entity.load(loadedRecord.doc);
          return entity;
        });
      });

    return from(promise);  }

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
          reduce: '_stats'
        },
        last_month: {
          map: this.getLastAverageAttendanceMapFunction(),
          reduce: '_stats'
        }
      }
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
          entity.load(loadedRecord.doc);
          return entity;
        });
      });

    return from(promise);
  }

  private createNotesIndex(): Promise<any> {
    const designDoc = {
      _id: '_design/notes_index',
      views: {
        by_child: {
          map: '(doc) => { ' +
            'if (!doc._id.startsWith("' + Note.ENTITY_TYPE + '")) return;' +
            'doc.children.forEach(childId => emit(childId)); ' +
            '}'
        }
      }
    };

    return this.db.saveDatabaseIndex(designDoc);
  }

  getEducationalMaterialsOfChild(childId: string): Observable<EducationalMaterial[]> {
    return from(
      this.entityMapper.loadType<EducationalMaterial>(EducationalMaterial)
        .then(loadedEntities => {
          return loadedEntities.filter(o => o.child === childId);
        })
    );
  }

  getAserResultsOfChild(childId: string): Observable<Aser[]> {
    return from(
      this.entityMapper.loadType<Aser>(Aser)
        .then(loadedEntities => {
          return loadedEntities.filter(o => o.child === childId);
        })
    );
  }
   getSchools(childId: string): Promise<School[]> {
    return this.entityMapper.loadTypeForRelation<Child, School, ChildSchoolRelation> (
      Child,
      School,
      ChildSchoolRelation,
      childId,
    );
  }


  getCurrentSchool(childId: string): Promise<School> {
    return this.getRelations(childId)
      .then((relations: ChildSchoolRelation[]) => {
        if (relations.length > 0) {
          let max: ChildSchoolRelation = relations[0];
          relations.forEach(relation => max = relation.start > max.start ? relation : max);
          return max.end ? null : max.getSchool(this.entityMapper);
        }
      });
  }

  getCurrentRelation(childId: string): Promise<ChildSchoolRelation> {
    return this.getRelations(childId)
      .then((relations: ChildSchoolRelation[]) => {
        let max: ChildSchoolRelation = relations[0];
        relations.forEach(relation => max = relation.start > max.start ? relation : max);
        return max;
      })
  }

  getRelations(childId: string): Promise<ChildSchoolRelation[]> {
    return this.entityMapper.loadType<ChildSchoolRelation>(ChildSchoolRelation).then((relations: ChildSchoolRelation[]) => {
      return relations.filter(relation => {
        return relation.childId === childId
      });
   })
  }

  getViewableSchools(childId: string): Observable<ViewableSchool[]> {
    return this.querySchoolsOfChild(childId).pipe(map((relations: ChildSchoolRelation[]) => {
      const schools: ViewableSchool[] = [];
      relations.forEach(async relation => {
        const school: School = await relation.getSchool(this.entityMapper);
        schools.push(new ViewableSchool(relation, school));
      });
      return schools;
    }));
  }
}
