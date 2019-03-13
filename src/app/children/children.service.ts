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
import {Gender} from './Gender';
import {School} from '../schools/school';
import {map} from 'rxjs/operators';
import {load} from '@angular/core/src/render3';

export class TableChild {
  constructor(private _child?: Child, private _school?: School, private _childSchoolRelation?: ChildSchoolRelation) { }
  get child(): Child {
    return this._child;
  }
  set child(value: Child) {
    this._child = value;
  }
  get school(): School {
    return this._school;
  }
  set school(value: School) {
    this._school = value;
  }
  get childSchoolRelation(): ChildSchoolRelation {
    return this._childSchoolRelation;
  }
  set childSchoolRelation(value: ChildSchoolRelation) {
    this._childSchoolRelation = value;
  }
  get projectNumber(): string {
    return this._child.projectNumber
  }
  get age(): number {
    return this._child.age;
  }
  get dateOfBirth(): Date {
    return this._child.dateOfBirth;
  }
  get gender(): Gender {
    return this._child.gender
  }
  get schoolClass(): string {
    return this._childSchoolRelation.class;
  }
  get schoolId(): string {
    return this._school.getId();
  }
  get center(): string {
    return this._child.center;
  }
  get status(): string {
    return this._child.status;
  }
  get admissionDate(): Date {
    return this._child.admissionDate;
  }
  get motherTongue(): string {
    return this._child.motherTongue;
  }
  get has_aadhar(): string {
    return this._child.has_aadhar
  }
  get has_bankAccount(): string {
    return this._child.has_bankAccount;
  }
  get has_kanyashree(): string {
    return this._child.has_kanyashree;
  }
  get has_rationCard(): string {
    return this._child.has_rationCard;
  }
  get has_BplCard(): string {
    return this._child.has_BplCard;
  }
  get health_vaccinationStatus(): string {
    return this._child.health_vaccinationStatus;
  }
  get health_lastDentalCheckup(): Date {
    return this._child.health_lastDentalCheckup
  }
  get health_lastEyeCheckput(): Date {
    return this._child.health_lastEyeCheckup;
  }
  get health_eyeHealthStatus(): string {
    return this._child.health_eyeHealthStatus;
  }
  get health_lastENTCheckup(): Date {
    return this._child.health_lastENTCheckup;
  }
  get health_lastVitaminD(): Date {
    return this._child.health_lastVitaminD;
  }
  get health_lastDeworming(): Date {
    return this._child.health_lastDeworming;
  }
  isActive(): boolean {
    return this._child.isActive();
  }
  getPhoto(): string {
    return this._child.getPhoto()
  }
  getId(): string {
    return this._child.getId()
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

  async getChildrenForList(): Promise<TableChild[]> {
    const children = await this.entityMapper.loadType<Child>(Child);
    const schools = await this.entityMapper.loadType<School>(School);
    const relations = await this.entityMapper.loadType<ChildSchoolRelation>(ChildSchoolRelation);
    const tableData: TableChild[] = [];
    children.forEach(child => {
      const tableChild = new TableChild();
      tableChild.child = child;
      const childRelations = relations.filter(relation => relation.childId === child.getId());
      childRelations.sort((a, b) => a.start > b.start ? 1 : a.start === b.start ? 0 : -1);
      tableChild.childSchoolRelation = childRelations.pop();
      tableChild.school = schools.filter(school => school.getId() === tableChild.childSchoolRelation.schoolId)[0];
      tableData.push(tableChild);
    });
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

  queryLatestSchool(childId: string) {
    const promise: Promise<any> = this.db.query(
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

    return from(promise);
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
