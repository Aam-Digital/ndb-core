import { TestBed } from '@angular/core/testing';

import { BlobServiceService } from './blob-service.service';

describe('BlobServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BlobServiceService = TestBed.get(BlobServiceService);
    expect(service).toBeTruthy();
  });
});
