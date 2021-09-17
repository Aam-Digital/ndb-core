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
import { Angulartics2Piwik } from "angulartics2/piwik";
import { EntityMapperService } from "./core/entity/entity-mapper.service";
import { Config } from "./core/config/config";
import { USAGE_ANALYTICS_CONFIG_ID } from "./core/analytics/usage-analytics-config";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const mockAppSettings: IAppConfig = {
    database: { name: "", remote_url: "" },
    session_type: undefined,
    site_name: "",
  };

  beforeEach(
    waitForAsync(() => {
      AppConfig.settings = mockAppSettings;

      TestBed.configureTestingModule({
        imports: [AppModule],
        providers: [
          { provide: AppConfig, useValue: jasmine.createSpyObj(["load"]) },
        ],
      }).compileComponents();
      TestBed.inject(ApplicationInitStatus); // This ensures that the AppConfig is loaded before test execution
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
    const testConfig = {
      "appConfig:usage-analytics": {
        url: "matomo-test-endpoint",
        site_id: "101",
      },
    };
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "load").and.resolveTo(new Config(testConfig));
    const angulartics = TestBed.inject(Angulartics2Piwik);
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
});
