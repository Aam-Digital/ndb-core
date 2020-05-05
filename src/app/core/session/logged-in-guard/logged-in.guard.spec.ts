/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { TestBed, inject } from '@angular/core/testing';

import { LoggedInGuard } from './logged-in.guard';
import { MockSessionService } from '../session-service/mock-session.service';
import { SessionService } from '../session-service/session.service';
import { EntitySchemaService } from 'app/core/entity/schema/entity-schema.service';

describe('LoggedInGuard', () => {

  let sessionService: SessionService;

  beforeEach(() => {
    sessionService = new MockSessionService(new EntitySchemaService());

    TestBed.configureTestingModule({
      providers: [LoggedInGuard,
        {provide: SessionService, useValue: sessionService},
      ],
    });
  });


   it('should be created', inject([LoggedInGuard], (guard: LoggedInGuard) => {
    expect(guard).toBeTruthy();
   }));

  it('should prevent access when logged out', inject([LoggedInGuard], (guard: LoggedInGuard) => {
    spyOn(sessionService, 'isLoggedIn').and.returnValue(false);
    expect(guard.canActivate()).toBeFalsy();
  }));

  it('should allow access when logged out', inject([LoggedInGuard], (guard: LoggedInGuard) => {
    spyOn(sessionService, 'isLoggedIn').and.returnValue(true);
    expect(guard.canActivate()).toBeTruthy();
  }));

});
