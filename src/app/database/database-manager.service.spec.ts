import { TestBed, inject } from '@angular/core/testing';

import { DatabaseManagerService } from './database-manager.service';

describe('DatabaseManagerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatabaseManagerService]
    });
  });

  it('should be created', inject([DatabaseManagerService], (service: DatabaseManagerService) => {
    expect(service).toBeTruthy();
  }));
});
