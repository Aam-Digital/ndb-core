import { TestBed } from '@angular/core/testing';

import { FirebaseNotificationService } from './firebase-messaging-service.service';

describe('FirebaseNotificationService', () => {
  let service: FirebaseNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebaseNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
