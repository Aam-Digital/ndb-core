import { TestBed } from '@angular/core/testing';

import { BlobServiceService } from './blob-service.service';
import { SessionService } from 'app/session/session.service';

describe('BlobServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionService
      ],
    })
    .compileComponents();
  }));

  it('should be created', () => {
    const service: BlobServiceService = TestBed.get(BlobServiceService);
    expect(service).toBeTruthy();
  });
});
