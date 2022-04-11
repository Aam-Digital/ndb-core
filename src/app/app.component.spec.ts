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

import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { ApplicationInitStatus } from "@angular/core";
import { AppModule } from "./app.module";
import { AppConfig } from "./core/app-config/app-config";
import { IAppConfig } from "./core/app-config/app-config.model";
import { Angulartics2Matomo } from "angulartics2/matomo";
import { EntityMapperService } from "./core/entity/entity-mapper.service";
import { Config } from "./core/config/config";
import { USAGE_ANALYTICS_CONFIG_ID } from "./core/analytics/usage-analytics-config";
import { environment } from "../environments/environment";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { EntityRegistry } from "./core/entity/database-entity.decorator";
import { BehaviorSubject } from "rxjs";
import { SyncState } from "./core/session/session-states/sync-state.enum";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { SessionService } from "./core/session/session-service/session.service";
import { Router } from "@angular/router";
import { ConfigService } from "./core/config/config.service";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  const syncState = new BehaviorSubject(SyncState.UNSYNCED);
  const loginState = new BehaviorSubject(LoginState.LOGGED_OUT);
  let mockSessionService: jasmine.SpyObj<SessionService>;

  const mockAppSettings: IAppConfig = {
    database: { name: "", remote_url: "" },
    session_type: undefined,
    site_name: "",
  };

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(
        ["getCurrentUser", "isLoggedIn"],
        {
          syncState: syncState,
          loginState: loginState,
        }
      );
      mockSessionService.getCurrentUser.and.returnValue({
        name: "test user",
        roles: [],
      });
      AppConfig.settings = mockAppSettings;

      TestBed.configureTestingModule({
        imports: [AppModule, HttpClientTestingModule],
        providers: [
          { provide: AppConfig, useValue: jasmine.createSpyObj(["load"]) },
          { provide: SessionService, useValue: mockSessionService },
        ],
      }).compileComponents();

      TestBed.inject(ApplicationInitStatus); // This ensures that the AppConfig is loaded before test execution
      spyOn(TestBed.inject(EntityRegistry), "add"); // Prevent error with duplicate registration
    })
  );

  function createComponent() {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    // hide angular component so that test results are visible in test browser window
    fixture.debugElement.nativeElement.style.visibility = "hidden";
  });

  it("should be created", () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it("should start tracking with config from db", fakeAsync(() => {
    environment.production = true; // tracking is only active in production mode
    const testConfig = {
      "appConfig:usage-analytics": {
        url: "matomo-test-endpoint",
        site_id: "101",
      },
    };
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "load").and.resolveTo(
      new Config(Config.CONFIG_KEY, testConfig)
    );
    const angulartics = TestBed.inject(Angulartics2Matomo);
    const startTrackingSpy = spyOn(angulartics, "startTracking");

    createComponent();
    tick();

    expect(startTrackingSpy).toHaveBeenCalledTimes(1);
    expect(window["_paq"]).toContain([
      "setSiteId",
      testConfig[USAGE_ANALYTICS_CONFIG_ID].site_id,
    ]);

    discardPeriodicTasks();
  }));

  it("should reload routes whenever a new user logs in once the sync is completed for this user", fakeAsync(() => {
    const routeSpy = spyOn(TestBed.inject(Router), "navigate");
    const configSpy = spyOn(TestBed.inject(ConfigService), "loadConfig");
    createComponent();

    loginState.next(LoginState.LOGGED_IN);
    tick();
    expect(routeSpy).not.toHaveBeenCalled();
    expect(configSpy).not.toHaveBeenCalled();

    syncState.next(SyncState.COMPLETED);
    tick();
    expect(routeSpy).toHaveBeenCalledTimes(1);
    expect(configSpy).toHaveBeenCalledTimes(1);

    syncState.next(SyncState.COMPLETED);
    tick();
    expect(routeSpy).toHaveBeenCalledTimes(1);
    expect(configSpy).toHaveBeenCalledTimes(1);

    loginState.next(LoginState.LOGGED_OUT);
    tick();
    expect(routeSpy).toHaveBeenCalledTimes(1);
    expect(configSpy).toHaveBeenCalledTimes(1);

    loginState.next(LoginState.LOGGED_IN);
    // No new calls
    tick();
    expect(routeSpy).toHaveBeenCalledTimes(1);
    expect(configSpy).toHaveBeenCalledTimes(1);

    syncState.next(SyncState.COMPLETED);
    tick();
    expect(routeSpy).toHaveBeenCalledTimes(2);
    expect(configSpy).toHaveBeenCalledTimes(2);
    discardPeriodicTasks();
  }));
});
