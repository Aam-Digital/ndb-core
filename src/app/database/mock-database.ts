/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Database } from './database';
import {Note} from '../children/notes/note';
import {AttendanceMonth} from '../children/attendance/attendance-month';

/**
 * Wrapper for a PouchDB instance to decouple the code from
 * that external library.
 *
 * Additional convenience functions on top of the PouchDB API
 * should be implemented in the abstract `Database` class.
 */
export class MockDatabase extends Database {
  private data = [];

  constructor() {
    super();
  }


  get(id: string) {
    if (!this.exists(id)) {
      return Promise.reject({'status': 404, 'message': 'object not found'});
    }

    const index = this.findIndex(id);
    const result = this.data[index];

    return Promise.resolve(result);
  }

  allDocs(options?: any) {
    let result = this.data;

    // default options provided through getAll(prefix): {include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'}
    // MockDatabase ignores endkey and only implements filtering based on startkey/prefix
    if (options && options.hasOwnProperty('startkey')) {
      result = this.data.filter(o => o._id.startsWith(options.startkey));
    }

    return Promise.resolve(result);
  }

  put(object: any, forceUpdate?: boolean) {
    let result;

    // check if unintentionally (no _rev) a duplicate _id is used
    if (this.exists(object._id)) {
      if (!object._rev) {
        return Promise.reject({ 'message': '_id already exists'});
      } else {
        result = this.overwriteExisting(object);
      }
    } else {
      object._rev = true;
      result = Promise.resolve(this.data.push(object));
    }

    return result;
  }

  private overwriteExisting(object: any): Promise<any> {
    const index = this.data.findIndex(e => e._id === object._id);
    if (index > -1) {
      this.data[index] = object;
      return Promise.resolve(object);
    } else {
      return Promise.reject({ 'message': 'failed to overwrite existing object'});
    }
  }

  remove(object: any) {
    if (!this.exists(object._id)) {
      return Promise.reject({'status': 404, 'message': 'object not found'});
    }

    const index = this.findIndex(object._id);
    if (index > -1) {
      this.data.splice(index, 1);
    }

    return Promise.resolve(true);
  }

  private exists(id: string) {
    return (this.findIndex(id) > -1);
  }

  private findIndex(id: string) {
    return this.data.findIndex(o => o._id === id);
  }



  query(fun: any, options?: any): Promise<any> {
    // TODO: implement generic mock query function
    /* SAMPLE INPUT:
      query('notes_index/by_child', {key: childId, include_docs: true});
      query('avg_attendance_index/three_months', {reduce: true, group: true});
    */

    // mock specific indices
    let filter;
    let reduce;
    switch (fun) {
      case 'notes_index/by_child':
        filter = (e: Note) => e.getType() === Note.ENTITY_TYPE && e.children.includes(options.key);
        break;
      case 'attendences_index/by_child':
        filter = (e: AttendanceMonth) => e.getType() === AttendanceMonth.ENTITY_TYPE && e.student === options.key;
        break;
      case 'attendences_index/by_month':
        filter = (e: AttendanceMonth) => e.getType() === AttendanceMonth.ENTITY_TYPE && e.month === options.month;
        break;
      case 'avg_attendance_index/three_months':
        filter = (e: AttendanceMonth) => e.getType() === AttendanceMonth.ENTITY_TYPE
          && this.isWithinLastMonths(e.month, new Date(), 3);
        reduce = this.getStatsReduceFun((e: AttendanceMonth) => e.student,
          (e: AttendanceMonth) => (e.daysAttended / (e.daysWorking - e.daysExcused)));
        break;
      case 'avg_attendance_index/last_month':
        filter = (e: AttendanceMonth) => e.getType() === AttendanceMonth.ENTITY_TYPE
          && this.isWithinLastMonths(e.month, new Date(), 1);
        reduce = this.getStatsReduceFun((e: AttendanceMonth) => e.student,
          (e: AttendanceMonth) => (e.daysAttended / (e.daysWorking - e.daysExcused)));
        break;
    }
    if (filter !== undefined) {
      if (reduce !== undefined) {
        return this.getAll().then(results => {
          results = results.filter(filter);
          results = results.reduce(reduce, []);
          return { rows: results }
        });
      } else {
        return this.getAll().then(results => {
          return { rows: results.filter(filter) }
        });
      }
    }


    console.warn('MockDatabase does not implement "query()"');
    return Promise.resolve({ rows: []});
  }

  private isWithinLastMonths(date: Date, now: Date, numberOfMonths: number): boolean {
    let months;
    months = (now.getFullYear() - date.getFullYear()) * 12;
    months -= date.getMonth();
    months += now.getMonth();
    if (months < 0) { return false; }
    return months <= numberOfMonths;
  }

  private getStatsReduceFun(keyFun: (any) => string, valueFun: (any) => number) {
    return (acc, value) => {
      const stats = { key: keyFun(value), value: { count: 1, sum: valueFun(value) } };
      const existing = acc.filter(x => x.key === keyFun(value));
      if (existing.length > 0) {
        const v = existing[0].value;
        v.count++;
        v.sum = v.sum + stats.value.sum;
      } else {
        acc.push(stats);
      }

      return acc;
    };
  }


  saveDatabaseIndex(designDoc) {
    // TODO: implement mock query
    /* SAMPLE INPUT:
    const designDoc = {
      _id: '_design/attendance_index',
      views: {
        by_name: {
          map: (doc) => { emit(doc.child); }
        },
        by_month: {
          map: (doc) => { emit(doc.month); }
        }
      }
    };
     */


    console.warn('MockDatabase does not implement "saveDatabaseIndex()"');
    return Promise.resolve({});
  }
}
