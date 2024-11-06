import { TestBed } from '@angular/core/testing';

import { GpsService } from './gps.service';

describe('GpsService', () => {
  let service: GpsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
