import { TestBed } from '@angular/core/testing';

import { DemoDataService } from './demo-data.service';

describe('DemoDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DemoDataService = TestBed.get(DemoDataService);
    expect(service).toBeTruthy();
  });
});
