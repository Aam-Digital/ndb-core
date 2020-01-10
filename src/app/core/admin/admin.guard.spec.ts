import { TestBed, inject } from '@angular/core/testing';

import { AdminGuard } from './admin.guard';
import { SessionService } from '../session/session.service';
import { User } from '../user/user';

describe('AdminGuard', () => {
  let mockSessionService;

  beforeEach(() => {
    const testUser = new User('');
    testUser.admin = true;
    mockSessionService = { getCurrentUser: () => { return testUser; } };

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        {provide: SessionService, useValue: mockSessionService},
      ],
    });
  });

  it('should ...', inject([AdminGuard], (guard: AdminGuard) => {
    expect(guard).toBeTruthy();
  }));
});
