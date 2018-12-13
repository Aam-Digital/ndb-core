import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {Child} from './child';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {AttendanceMonth} from './attendance/attendance-month';
import {Database} from '../database/database';
import {Note} from './notes/note';
import {EducationalMaterial} from './educational-material/educational-material';
import {Aser} from './aser/aser';
import {ChildSchoolRelation} from './childSchoolRelation';
import {Gender} from './Gender';
import {School} from '../schools/school';

export class ViewableChild {
  constructor(private _child: Child, private _school: School, private _childSchoolRelation?: ChildSchoolRelation) { }
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
  getProjectNumber(): string {
    return this._child.projectNumber
  }
  getAge(): number {
    return this._child.age;
  }
  getDateOfBirth(): Date {
    return this._child.dateOfBirth;
  }
  getGender(): Gender {
    return this._child.gender
  }
  getSchoolClass(): string {
    return '5';
  }
  getSchoolId(): string {
    return this._school.getId();
  }
  getCenter(): string {
    return this._child.center;
  }
  getStatus(): string {
    return this._child.status;
  }
  getAdmissionDate(): Date {
    return this._child.admissionDate;
  }
  getMotherTongue(): string {
    return this._child.motherTongue;
  }
  getHasAadhar(): string {
    return this._child.has_aadhar
  }
  getHasBankaccount(): string {
    return this._child.has_bankAccount;
  }
  getHasKanyashree(): string {
    return this._child.has_kanyashree;
  }
  getHasRationCard(): string {
    return this._child.has_rationCard;
  }
  getHasBplCard(): string {
    return this._child.has_BplCard;
  }
  getHealthVaccinationStatus(): string {
    return this._child.health_vaccinationStatus;
  }
  getHealthLastDentalCheckup(): Date {
    return this._child.health_lastDentalCheckup
  }
  getHealthLastEyeCheckup(): Date {
    return this._child.health_lastEyeCheckup;
  }
  getHealthEyeHealthStatus(): string {
    return this._child.health_eyeHealthStatus;
  }
  getHealthLastEntCheckup(): Date {
    return this._child.health_lastENTCheckup;
  }
  getHealthLastVitaminD(): Date {
    return this._child.health_lastVitaminD;
  }
  getHealthLastDeworming(): Date {
    return this._child.health_lastDeworming;
  }
}

@Injectable()
export class ChildrenService {

  constructor(private entityMapper: EntityMapperService,
              private db: Database) {
    this.createAttendanceAnalysisIndex();
    this.createNotesIndex();
    this.createAttendancesIndex();
  }

  getChildren(): Promise<ViewableChild[]> {
    return this.entityMapper.loadType<Child>(Child)
      .then((children: Child[]) => {
        const vChildren: ViewableChild[] = [];
        children.forEach(async child =>
          vChildren.push(new ViewableChild(child, await child.getCurrentSchool(this.entityMapper))));
          return vChildren;
      })
  }

  getChild(id: string): Observable<Child> {
    return Observable.fromPromise(this.entityMapper.load<Child>(Child, id));
  }


  getAttendances(): Observable<AttendanceMonth[]> {
    return Observable.fromPromise(this.entityMapper.loadType<AttendanceMonth>(AttendanceMonth));
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

    return Observable.fromPromise(promise);
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

    return Observable.fromPromise(promise);
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

    return Observable.fromPromise(promise);
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
    return Observable.fromPromise(
      this.entityMapper.loadType<EducationalMaterial>(EducationalMaterial)
        .then(loadedEntities => {
          return loadedEntities.filter(o => o.child === childId);
        })
    );
  }

  getAserResultsOfChild(childId: string): Observable<Aser[]> {
    return Observable.fromPromise(
      this.entityMapper.loadType<Aser>(Aser)
        .then(loadedEntities => {
          return loadedEntities.filter(o => o.child === childId);
        })
    );
  }
}
