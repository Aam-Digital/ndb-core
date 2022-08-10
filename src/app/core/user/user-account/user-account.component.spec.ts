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
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { UserModule } from "../user.module";
import { LoggingService } from "../../logging/logging.service";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";

describe("UserAccountComponent", () => {
  let component: UserAccountComponent;
  let fixture: ComponentFixture<UserAccountComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(waitForAsync(() => {
    mockSessionService = jasmine.createSpyObj("sessionService", [
      "getCurrentUser",
    ]);
    mockSessionService.getCurrentUser.and.returnValue({
      name: "TestUser",
      roles: [],
    });
    mockLoggingService = jasmine.createSpyObj(["error"]);

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        UserModule,
        Angulartics2Module.forRoot(),
        NoopAnimationsModule,
        TabStateModule,
      ],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
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
