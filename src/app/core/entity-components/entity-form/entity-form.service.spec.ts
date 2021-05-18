import { TestBed } from '@angular/core/testing';

import { EntityFormService } from './entity-form.service';

describe('EntityFormService', () => {
  let service: EntityFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
