import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {Child} from './child';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {AttendanceMonth} from './attendance/attendance-month';

@Injectable()
export class ChildrenService {
  constructor(private entityMapper: EntityMapperService) {
  }

  getChildren(): Observable<Child[]> {
    return Observable.fromPromise(
      this.entityMapper.loadType<Child>(Child).then(
        loadedEntities => { return loadedEntities; }
      )
    );
  }

  getChild(id: string): Observable<Child> {
    return Observable.fromPromise(
      this.entityMapper.load<Child>(Child, id)
        .then(result => { return result; })
    );
  }

  getAttendances(): Observable<AttendanceMonth[]> {
    return Observable.fromPromise(
      this.entityMapper.loadType<AttendanceMonth>(AttendanceMonth)
        .then(loadedEntities => { return loadedEntities; })
    );
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
    return Observable.fromPromise(
      this.entityMapper.load<AttendanceMonth>(AttendanceMonth, id)
        .then(result => { return result; })
    );
  }

  saveAttendance(entity: AttendanceMonth) {
    this.entityMapper.save(entity);
  }

  removeAttendance(entity: AttendanceMonth) {
    this.entityMapper.remove(entity);
  }
}
