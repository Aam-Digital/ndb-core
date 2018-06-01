import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {Child} from './child';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {AttendanceMonth} from './attendance/attendance-month';
import {Database} from '../database/database';

@Injectable()
export class ChildrenService {
  attendanceIndicesUpdated: Promise<any>;

  constructor(private entityMapper: EntityMapperService,
              private db: Database) {
    this.attendanceIndicesUpdated = this.createAttendanceAnalysisIndex();
  }

  getChildren(): Observable<Child[]> {
    return Observable.fromPromise(this.entityMapper.loadType<Child>(Child));
  }

  getChild(id: string): Observable<Child> {
    return Observable.fromPromise(this.entityMapper.load<Child>(Child, id));
  }

  getAttendances(): Observable<AttendanceMonth[]> {
    return Observable.fromPromise(this.entityMapper.loadType<AttendanceMonth>(AttendanceMonth));
  }

  getAttendancesOfChild(childId: string): Observable<AttendanceMonth[]> {
    return Observable.fromPromise(
      this.entityMapper.loadType<AttendanceMonth>(AttendanceMonth)
        .then(loadedEntities => {
          return loadedEntities.filter(o => o.student === childId);
        })
    );
  }

  getAttendance(id: string): Observable<AttendanceMonth> {
    return Observable.fromPromise(this.entityMapper.load<AttendanceMonth>(AttendanceMonth, id));
  }

  saveAttendance(entity: AttendanceMonth) {
    this.entityMapper.save(entity);
  }

  removeAttendance(entity: AttendanceMonth) {
    this.entityMapper.remove(entity);
  }


  queryAttendanceLast3Months() {
    return this.attendanceIndicesUpdated
      .then(() => this.db.query('avg_attendance_index/three_months', {reduce: true, group: true}));
  }

  queryAttendanceLastMonth() {
    return this.attendanceIndicesUpdated
      .then(() => this.db.query('avg_attendance_index/last_month', {reduce: true, group: true}))
  }


  private createAttendanceAnalysisIndex(): Promise<any> {
    const designDoc = {
      _id: '_design/avg_attendance_index',
      views: {
        three_months: {
          map: this.getAverageAttendanceMap().toString(),
          reduce: '_stats'
        },
        last_month: {
          map: this.getLastAverageAttendanceMap().toString(),
          reduce: '_stats'
        }
      }
    };

    return this.db.saveDatabaseIndex(designDoc);
  }

  private getAverageAttendanceMap (): (doc) => void {
    const emit = (x, y?) => {}; // defined to avoid Typescript error. Actually `emit` is provided by pouchDB to the `map` function
    // `emit(x)` to add x as a key to the index that can be searched

    return (doc) => {
      if (!doc._id.startsWith('AttendanceMonth:')) {
        return;
      }
      if (!isWithinLast3Months(new Date(doc.month), new Date())) {
        return;
      }

      emit(doc.student, doc.daysAttended / (doc.daysWorking - doc.daysExcused));

      function isWithinLast3Months(date: Date, now: Date) {
        let months;
        months = (now.getFullYear() - date.getFullYear()) * 12;
        months -= date.getMonth();
        months += now.getMonth();

        if (months < 0) {
          return false;
        }
        return months <= 3;
      }
    };
  }

  private getLastAverageAttendanceMap () {
    const emit = (x, y?) => {}; // defined to avoid Typescript error. Actually `emit` is provided by pouchDB to the `map` function
    // `emit(x)` to add x as a key to the index that can be searched

    return (doc) => {
      if (!doc._id.startsWith('AttendanceMonth:')) {
        return;
      }
      if (!isWithinLastMonth(new Date(doc.month), new Date())) {
        return;
      }

      emit(doc.student, doc.daysAttended / (doc.daysWorking - doc.daysExcused));

      function isWithinLastMonth(date: Date, now: Date) {
        let months;
        months = (now.getFullYear() - date.getFullYear()) * 12;
        months -= date.getMonth();
        months += now.getMonth();

        return months === 1;
      }
    };
  }

}
