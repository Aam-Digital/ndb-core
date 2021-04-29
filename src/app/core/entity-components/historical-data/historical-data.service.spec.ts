import { TestBed } from '@angular/core/testing';

import { HistoricalDataService } from './historical-data.service';

describe('HistoricalDataService', () => {
  let service: HistoricalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoricalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
