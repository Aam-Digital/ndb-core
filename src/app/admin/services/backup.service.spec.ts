import {TestBed} from '@angular/core/testing';

import { BackupService } from './backup.service';
import {Database} from '../../database/database';
import {PapaParseModule} from 'ngx-papaparse';
import {MockDatabase} from '../../database/mock-database';

describe('BackupService', () => {
  let db: Database;
  let service: BackupService;

  beforeEach(() => {
    db = new MockDatabase();
    TestBed.configureTestingModule({
      imports: [PapaParseModule],
      providers: [
        BackupService,
        {provide: Database, useValue: db},
      ]
    });

    service = TestBed.get(BackupService);
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('clearDatabase should remove all records', (done) => {
    const setup = db.put({_id: 'Test:1', test: 1})
      .then(() => db.getAll()).then(res => expect(res.length).toBe(1));

    setup
      .then(() => service.clearDatabase())
      .then(() => db.getAll()).then(res => expect(res.length).toBe(0))
      .then(() => done())
      .catch(err => {
        expect(false).toBeTruthy('unexpected error occured: ' + err);
        done();
      });
  });


  it('getJsonExport should return all records', (done) => {
    const setup = db.put({_id: 'Test:1', test: 1})
      .then(() => db.put({_id: 'Test:2', test: 2}))
      .then(() => db.getAll()).then(res => expect(res.length).toBe(2));

    setup
      .then(() => service.getJsonExport())
      .then(res => {
        expect(res.split(BackupService.SEPARATOR_ROW).length).toBe(2);
        done();
      })
      .catch(err => {
        expect(false).toBeTruthy('unexpected error occured: ' + err);
        done();
      });
  });


  it('getJsonExport | clearDatabase | importJson should restore all records', (done) => {
    let originalData;
    let backup;

    const setup = db.put({_id: 'Test:1', test: 1})
      .then(() => db.put({_id: 'Test:2', test: 2}))
      .then(() => db.getAll())
      .then(res => {
        expect(res.length).toBe(2);
        originalData = res;
      });

    const perform = setup
      .then(() => service.getJsonExport()).then(res => backup = res)
      .then(() => service.clearDatabase())
      .catch(err => {
        expect(false).toBeTruthy('1unexpected error occured: ' + err);
      })
      .then(() => service.importJson(backup, true));

    perform
      .then(() => db.getAll())
      .then(res => {
        expect(res.length).toBe(2, 'number of records not matching');

        expect(res.map(ignoreRevProperty)).toEqual(originalData.map(ignoreRevProperty),
          'restored records not identical to original records (_rev ignored)');

        done();
      })
      .catch(err => {
        expect(false).toBeTruthy('unexpected error occured: ' + err);
        done();
      });
  });


  it('getCsvExport should contain a line for every record', (done) => {
    const setup = db.put({_id: 'Test:1', test: 1})
      .then(() => db.put({_id: 'Test:2', test: 2}))
      .then(() => db.getAll()).then(res => expect(res.length).toBe(2));

    setup
      .then(() => service.getCsvExport())
      .then(res => {
        expect(res.split(BackupService.SEPARATOR_ROW).length).toBe(2 + 1); // includes 1 header line
        done();
      })
      .catch(err => {
        expect(false).toBeTruthy('unexpected error occured: ' + err);
        done();
      });
  });

  it('getCsvExport should contain a column for every property', (done) => {
    const setup = db.put({_id: 'Test:1', test: 1})
      .then(() => db.put({_id: 'Test:2', other: 2}))
      .then(() => db.getAll()).then(res => expect(res.length).toBe(2));

    setup
      .then(() => service.getCsvExport())
      .then(res => {
        const rows = res.split(BackupService.SEPARATOR_ROW);
        expect(rows.length).toBe(2 + 1); // includes 1 header line
        expect(rows[0].split(BackupService.SEPARATOR_COL).length).toBe(3 + 1); // includes _rev
        done();
      })
      .catch(err => {
        expect(false).toBeTruthy('unexpected error occured: ' + err);
        done();
      });
  });


  it('importCsv should add records', (done) => {
    const csv = '_id' + BackupService.SEPARATOR_COL + 'test' + BackupService.SEPARATOR_ROW +
      '"Test:1"' + BackupService.SEPARATOR_COL + '1' + BackupService.SEPARATOR_ROW +
      '"Test:2"' + BackupService.SEPARATOR_COL + '2' + BackupService.SEPARATOR_ROW;

    service.importCsv(csv, true)
      .then(() => db.getAll())
      .then(res => {
        expect(res.length).toBe(2, 'number of records not matching');
        expect(res.map(ignoreRevProperty)).toEqual([{_id: 'Test:1', test: 1}, {_id: 'Test:2', test: 2}]);
        done();
      })
      .catch(err => {
        expect(false).toBeTruthy('unexpected error occured: ' + err);
        done();
      });
  });

  it('importCsv should not add empty properties to records', (done) => {
    const csv = '_id' + BackupService.SEPARATOR_COL + 'other' + BackupService.SEPARATOR_COL + 'test' + BackupService.SEPARATOR_ROW +
      '"Test:1"' + BackupService.SEPARATOR_COL + BackupService.SEPARATOR_COL + '1';

    service.importCsv(csv)
      .then(() => db.getAll())
      .then(res => {
        expect(res.length).toBe(1, 'number of records not matching');
        expect(res[0].hasOwnProperty('other')).toBeFalsy('empty property was added anyway');
        expect(res.map(ignoreRevProperty)).toEqual([{_id: 'Test:1', test: 1}]);
        done();
      })
      .catch(err => {
        expect(false).toBeTruthy('unexpected error occured: ' + err);
        done();
      });
  });

  function ignoreRevProperty(x) {
    delete x._rev;
    return x;
  }
});
