import { TestBed } from '@angular/core/testing';

import { MockFileService } from './mock-file.service';

describe('MockFileService', () => {
  let service: MockFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
