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

import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { UserAccountComponent } from "./user-account.component";
import { SessionService } from "../../session/session-service/session.service";
import { LoggingService } from "../../logging/logging.service";
import { AuthService } from "../../session/auth/auth.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { NEVER } from "rxjs";

describe("UserAccountComponent", () => {
  let component: UserAccountComponent;
  let fixture: ComponentFixture<UserAccountComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(waitForAsync(() => {
    mockSessionService = jasmine.createSpyObj(
      "sessionService",
      ["getCurrentUser"],
      { syncState: NEVER, loginState: NEVER },
    );
    mockSessionService.getCurrentUser.and.returnValue({
      name: "TestUser",
      roles: [],
    });
    mockLoggingService = jasmine.createSpyObj(["error"]);

    TestBed.configureTestingModule({
      imports: [UserAccountComponent, MockedTestingModule.withState()],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: AuthService, useValue: { changePassword: () => undefined } },
        { provide: LoggingService, useValue: mockLoggingService },
      ],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });
});
