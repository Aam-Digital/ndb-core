import { TestBed, inject } from '@angular/core/testing';

import { LatestChangesService } from './latest-changes.service';

describe('LatestChangesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LatestChangesService]
    });
  });

  it('should be created', inject([LatestChangesService], (service: LatestChangesService) => {
    expect(service).toBeTruthy();
  }));
});
