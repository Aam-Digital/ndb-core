import { TestBed } from '@angular/core/testing';

import { DuplicateRecordsService } from './duplicate-records.service';

describe('DuplicateRecordsService', () => {
  let service: DuplicateRecordsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DuplicateRecordsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
