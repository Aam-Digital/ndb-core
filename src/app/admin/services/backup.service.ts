import { Injectable } from '@angular/core';
import {Database} from '../../database/database';
import {User} from '../../user/user';
import {Papa} from 'ngx-papaparse';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  static readonly SEPARATOR_ROW = '\n';
  static readonly SEPARATOR_COL = ',';

  constructor(private db: Database,
              private papa: Papa) { }

  getJsonExport(): Promise<string> {
    return this.db.getAll()
      .then(results => {
        let res = '';
        results.forEach(r => {
          res += JSON.stringify(r) + BackupService.SEPARATOR_ROW;
        });

        return res.trim();
      });
  }

  getCsvExport(): Promise<string> {
    return this.db.getAll()
      .then(results => {
        const resultFields = ['_id', '_rev'];
        results.forEach(r => {
          for (const propertyName in r) {
            if (resultFields.indexOf(propertyName) === -1) {
              resultFields.push(propertyName);
            }
          }
        });

        return this.papa.unparse(
          {data: results, fields: resultFields},
          {quotes: true, header: true});
      });
  }



  clearDatabase(): Promise<any> {
    const userEntityPrefix = new User('').getType() + ':';

    return this.db.getAll().then(allDocs => {
      const p = [];
      allDocs.forEach(row => {
        if (!row._id.startsWith(userEntityPrefix)) {
          // skip User entities in order to not break login!
          p.push(this.db.remove(row));
        }
      });
      return Promise.all(p);
    });
  }

  importJson(json, forceUpdate = false) {
    const promises = [];
    json.split(BackupService.SEPARATOR_ROW)
      .forEach(record => {
        promises.push(this.db.put(JSON.parse(record), forceUpdate));
      });
    return Promise.all(promises);
  }

  importCsv(csv, forceUpdate = false) {
    const promises = [];

    const parsedCsv = this.papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
    parsedCsv.data.forEach(record => {
      // remove undefined properties
      for (const propertyName in record) {
        if (record[propertyName] === null) {
          delete record[propertyName];
        }
      }

      promises.push(this.db.put(record, forceUpdate));
    });

    return Promise.all(promises);
  }
}
