import { TestBed } from '@angular/core/testing';

import { Entity2FileService } from './entity-2-file.service';

describe('Entity2FileService', () => {
  let service: Entity2FileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Entity2FileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
