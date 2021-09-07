import { TestBed } from '@angular/core/testing';

import { DataImportService } from './data-import.service';

describe('DataImportService', () => {
  let service: DataImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
