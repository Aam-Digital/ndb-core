import { TestBed } from '@angular/core/testing';

import { DataImportService } from './data-import.service';
import {PouchDatabase} from "../../core/database/pouch-database";
import {Database} from "../../core/database/database";

fdescribe('DataImportService', () => {
  let db: PouchDatabase;
  let service: DataImportService;

  beforeEach(() => {
    db = PouchDatabase.createWithInMemoryDB();
    TestBed.configureTestingModule({
      providers: [
        DataImportService,
        { provide: Database, usevalue: db }
      ]
    });
    service = TestBed.inject<DataImportService>(DataImportService);
  });

  afterEach(async () => {
    await db.destroy();
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
