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

import { Database } from "./database";
import { Note } from "../../child-dev-project/notes/model/note";
import { AttendanceMonth } from "../../child-dev-project/attendance/model/attendance-month";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";

/**
 * In-Memory database implementation that works as a drop-in replacement of {@link PouchDatabase}
 *
 * The MockDatabase internally stores all documents in a variable and tries to simulate functionality
 * as similar as possible to the PouchDatabase.
 */
export class MockDatabase extends Database {
  private data = [];

  /**
   * Create an in-memory database manager.
   */
  constructor() {
    super();
  }

  /**
   * see {@link Database}
   * @param id The primary id of the document
   */
  get(id: string) {
    if (!this.exists(id)) {
      return Promise.reject({ status: 404, message: "object not found" });
    }

    const index = this.findIndex(id);
    const result = this.data[index];

    return Promise.resolve(result);
  }

  /**
   * see {@link Database}
   * @param options Only 'startkey' is considered by the MockDatabase implementation
   */
  allDocs(options?: any) {
    let result = this.data;

    // default options provided through getAll(prefix): {include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'}
    // MockDatabase ignores endkey and only implements filtering based on startkey/prefix
    if (options && options.hasOwnProperty("startkey")) {
      result = this.data.filter((o) => o._id.startsWith(options.startkey));
    }

    return Promise.resolve(result);
  }

  /**
   * see {@link Database}
   * @param object The document to be saved
   * @param forceUpdate Whether a conflicting document will be forcefully overwritten
   */
  async put(object: any, forceUpdate?: boolean) {
    if (this.exists(object._id)) {
      return this.overwriteExisting(object);
    } else {
      object._rev = "x";
      this.data.push(object);
      return Promise.resolve(this.generateWriteResponse(object));
    }
  }

  private async overwriteExisting(object: any): Promise<any> {
    const existingObject = await this.get(object._id);

    if (object._rev !== existingObject._rev) {
      return Promise.reject({ message: "_id already exists" });
    }

    const index = this.data.findIndex((e) => e._id === object._id);
    if (index > -1) {
      object._rev = object._rev + "x";
      this.data[index] = object;
      return Promise.resolve(this.generateWriteResponse(object));
    } else {
      return Promise.reject({ message: "failed to overwrite existing object" });
    }
  }

  private generateWriteResponse(writtenObject: any) {
    return {
      ok: true,
      id: writtenObject._id,
      rev: writtenObject._rev,
    };
  }

  /**
   * see {@link Database}
   * @param object The document to be deleted
   */
  remove(object: any) {
    if (!this.exists(object._id)) {
      return Promise.reject({ status: 404, message: "object not found" });
    }

    const index = this.findIndex(object._id);
    if (index > -1) {
      this.data.splice(index, 1);
    }

    return Promise.resolve(true);
  }

  private exists(id: string) {
    return this.findIndex(id) > -1;
  }

  private findIndex(id: string) {
    return this.data.findIndex((o) => o._id === id);
  }

  /**
   * A "simulation" of queries as the PouchDatabase implementation would handle them.
   *
   * This has hard-coded response logic for some individual indices that are used in the app
   * and at the moment cannot handle generic creating and executing real queries.
   * You can add a mock implementation here for your specific query/index if necessary.
   *
   * @param fun The name of the previously created index
   * @param options Additional options for the query
   */
  async query(fun: any, options?: any): Promise<any> {
    // TODO: implement generic mock query function
    /* SAMPLE INPUT:
      query('notes_index/by_child', {key: childId, include_docs: true});
      query('avg_attendance_index/three_months', {reduce: true, group: true});
    */

    // mock specific indices
    let filterFun;
    let reducerFun;
    switch (fun) {
      case "notes_index/by_child":
        filterFun = (e) =>
          e._id.startsWith(Note.ENTITY_TYPE) &&
          e.children.includes(options.key);
        break;
      case "attendances_index/by_child":
        filterFun = (e) =>
          e._id.startsWith(AttendanceMonth.ENTITY_TYPE) &&
          e.student === options.key;
        break;
      case "attendances_index/by_month":
        filterFun = (e) => {
          if (!e._id.startsWith(AttendanceMonth.ENTITY_TYPE)) {
            return false;
          }
          e.month = new Date(e.month);
          return (
            e.month.getFullYear().toString() +
              "-" +
              (e.month.getMonth() + 1).toString() ===
            options.key
          );
        };
        break;
      case "avg_attendance_index/three_months":
        filterFun = (e) =>
          e._id.startsWith(AttendanceMonth.ENTITY_TYPE) &&
          this.isWithinLastMonths(e.month, new Date(), 3);
        reducerFun = this.getStatsReduceFun(
          (e: AttendanceMonth) => e.student,
          (e: AttendanceMonth) =>
            e.daysAttended / (e.daysWorking - (e.daysExcused ?? 0))
        );
        break;
      case "avg_attendance_index/last_month":
        filterFun = (e) =>
          e._id.startsWith(AttendanceMonth.ENTITY_TYPE) &&
          this.isWithinLastMonths(e.month, new Date(), 1);
        reducerFun = this.getStatsReduceFun(
          (e: AttendanceMonth) => e.student,
          (e: AttendanceMonth) =>
            e.daysAttended / (e.daysWorking - (e.daysExcused ?? 0))
        );
        break;
      case "childSchoolRelations_index/by_child":
        filterFun = (e) =>
          e._id.startsWith(ChildSchoolRelation.ENTITY_TYPE) &&
          e.childId === options.key;
        break;
      case "childSchoolRelations_index/by_school":
        filterFun = (e) =>
          e._id.startsWith(ChildSchoolRelation.ENTITY_TYPE) &&
          ((e.start <= new Date().setHours(0, 0, 0, 0) && !e.end) ||
            e.end >= new Date().setHours(0, 0, 0, 0)) &&
          e.schoolId === options.key;
        break;
      case "search_index/by_name":
        filterFun = (e) => {
          return (
            e.hasOwnProperty("searchIndices") &&
            e.searchIndices.some((word) =>
              word.toString().toLowerCase().includes(options.startkey)
            )
          );
        };
        break;
      case "childSchoolRelations_index/by_date":
        return this.filterForLatestRelationOfChild(
          options.endkey,
          options.limit
        );
      case "notes_index/note_date_in_days_for_child":
        filterFun = (e) => {
          return (
            e._id.startsWith(Note.ENTITY_TYPE) &&
            Array.isArray(e.children) &&
            e.date
          );
        };
        reducerFun = (prev, curr) => {
          for (const childId of curr.children) {
            const newEntry = {
              key: childId,
              value: { max: new Date(curr.date).getTime() / 86400000 },
            };

            const existingEntry = prev.find((e) => e.key === childId);
            if (!existingEntry) {
              prev.push(newEntry);
            } else {
              if (newEntry.value.max > existingEntry.value.max) {
                existingEntry.value.max = newEntry.value.max;
              }
            }
          }
          return prev;
        };
        break;
    }
    if (filterFun !== undefined) {
      if (reducerFun !== undefined) {
        const allData = await this.getAll();
        const filteredResults = allData.filter(filterFun);
        const reducedResults = filteredResults.reduce(reducerFun, []);
        return { rows: reducedResults };
      } else {
        const allData = await this.getAll();
        return {
          rows: allData.filter(filterFun).map((e) => {
            return { id: e._id, doc: e };
          }),
        };
      }
    }

    console.warn('MockDatabase does not implement "query()"');
    return { rows: [] };
  }

  private async filterForLatestRelationOfChild(
    childKey: string,
    limit: number
  ): Promise<any> {
    return new Promise((resolve) => {
      this.getAll().then((all) => {
        const relations = all.filter((e) =>
          e._id.startsWith(ChildSchoolRelation.ENTITY_TYPE)
        );
        const sorted = relations.sort((a, b) => {
          const aValue =
            a.childId + "_" + this.zeroPad(new Date(a.start).valueOf());
          const bValue =
            b.childId + "_" + this.zeroPad(new Date(b.start).valueOf());
          return aValue < bValue ? 1 : aValue === bValue ? 0 : -1;
        });
        const filtered: ChildSchoolRelation[] = sorted.filter(
          (doc) => doc.childId + "_" === childKey
        );
        let results: { doc: ChildSchoolRelation }[] = filtered.map(
          (relation) => {
            return { doc: relation };
          }
        );
        if (limit) {
          results = results.slice(0, limit);
        }
        resolve({ rows: results });
      });
    });
  }

  /**
   * This function is useful when comparing numbers on string level.
   * For example: 123 < 1111 but "123" > "1111"
   * That is why its being transformed to "0123" and "1111" so "0123" < "1111"
   * @param str the string that should be padded with zeros
   * @param length the length to which the string should be padded
   * @return string of the padded input
   */
  private zeroPad(str: string | number, length: number = 14): string {
    // with ECMAScript 2017 you can do a one-liner: 'return str.toString().padStart(length, '0');'
    let res = str.toString();
    while (res.length < length) {
      res = "0" + res;
    }
    return res;
  }

  private isWithinLastMonths(
    date: Date,
    now: Date,
    numberOfMonths: number
  ): boolean {
    if (!date) {
      return false;
    }
    date = new Date(date);

    let months;
    months = (now.getFullYear() - date.getFullYear()) * 12;
    months -= date.getMonth();
    months += now.getMonth();
    if (months < 0) {
      return false;
    }
    return months <= numberOfMonths;
  }

  private getStatsReduceFun(
    keyFun: (any) => string,
    valueFun: (any) => number
  ) {
    return (acc, value) => {
      const stats = {
        key: keyFun(value),
        value: { count: 1, sum: valueFun(value) },
      };
      const existing = acc.filter((x) => x.key === keyFun(value));
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

  /**
   * Currently not implemented for MockDatabase!
   *
   * Check (and extend) the `query` method for hard-coded mocks of some specific queries.
   *
   * @param designDoc
   */
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

    // tslint:disable-next-line:no-console
    console.debug('MockDatabase does not implement "saveDatabaseIndex()"');
    return Promise.resolve({});
  }
}
