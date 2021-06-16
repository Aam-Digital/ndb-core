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

import { UiComponent } from "./ui.component";
import { RouterTestingModule } from "@angular/router/testing";
import { SearchComponent } from "../search/search.component";
import { CommonModule } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { PrimaryActionComponent } from "../primary-action/primary-action.component";
import { SessionService } from "../../session/session-service/session.service";
import { SwUpdate } from "@angular/service-worker";
import { BehaviorSubject, of } from "rxjs";
import { ApplicationInitStatus } from "@angular/core";
import { UiModule } from "../ui.module";
import { Angulartics2Module } from "angulartics2";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { ConfigService } from "../../config/config.service";

describe("UiComponent", () => {
  let component: UiComponent;
  let fixture: ComponentFixture<UiComponent>;

  beforeEach(
    waitForAsync(() => {
      const mockSwUpdate = { available: of(), checkForUpdate: () => {} };
      const mockSession = jasmine.createSpyObj<SessionService>(
        ["isLoggedIn", "logout", "getDatabase"],
        { syncStateStream: new BehaviorSubject(SyncState.UNSYNCED) }
      );

      const mockConfig = jasmine.createSpyObj(["getConfig"]);
      mockConfig.configUpdated = new BehaviorSubject({});

      TestBed.configureTestingModule({
        declarations: [SearchComponent, PrimaryActionComponent, UiComponent],
        imports: [
          RouterTestingModule,
          CommonModule,
          UiModule,
          NoopAnimationsModule,
          Angulartics2Module.forRoot(),
        ],
        providers: [
          { provide: SessionService, useValue: mockSession },
          { provide: SwUpdate, useValue: mockSwUpdate },
          {
            provide: ConfigService,
            useValue: mockConfig,
          },
        ],
      }).compileComponents();
      TestBed.inject(ApplicationInitStatus); // This ensures that the AppConfig is loaded before test execution
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });
});
