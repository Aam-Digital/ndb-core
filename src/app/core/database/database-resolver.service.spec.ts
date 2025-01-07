import { TestBed } from '@angular/core/testing';

import { DatabaseResolverService } from './database-resolver.service';

describe('DatabaseResolverService', () => {
  let service: DatabaseResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
