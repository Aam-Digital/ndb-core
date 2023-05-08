import { TestBed } from '@angular/core/testing';

import { UnsavedChangesService } from './unsaved-changes.service';

describe('UnsavedChangesService', () => {
  let service: UnsavedChangesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnsavedChangesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
