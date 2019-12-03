import { TestBed } from '@angular/core/testing';

import { CloudFileService } from './cloud-file-service.service';
import { SessionService } from 'app/session/session.service';

describe('CloudFileService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionService
      ],
    })
    .compileComponents();
  });

  // TODO: write tests!
  // it('should be created', () => {
  //   const service: CloudFileService = TestBed.get(CloudFileService);
  //   expect(service).toBeTruthy();
  // });
});
