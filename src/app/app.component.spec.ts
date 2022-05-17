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
  flush,
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
import { Config } from "./core/config/config";
import { USAGE_ANALYTICS_CONFIG_ID } from "./core/analytics/usage-analytics-config";
import { environment } from "../environments/environment";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { EntityRegistry } from "./core/entity/database-entity.decorator";
import { Subject } from "rxjs";
import { SessionService } from "./core/session/session-service/session.service";
import { Database } from "./core/database/database";
import { UpdatedEntity } from "./core/entity/model/entity-update";
import { EntityMapperService } from "./core/entity/entity-mapper.service";
import { mockEntityMapper } from "./core/entity/mock-entity-mapper-service";
import { LocalSession } from "./core/session/session-service/local-session";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let entityUpdates: Subject<UpdatedEntity<Config>>;

  const mockAppSettings: IAppConfig = {
    database: { name: "", remote_url: "" },
    session_type: undefined,
    site_name: "",
  };

  beforeEach(
    waitForAsync(() => {
      AppConfig.settings = mockAppSettings;
      const entityMapper = mockEntityMapper();
      entityUpdates = new Subject();
      spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);

      TestBed.configureTestingModule({
        imports: [AppModule, HttpClientTestingModule],
        providers: [
          { provide: SessionService, useClass: LocalSession },
          { provide: EntityMapperService, useValue: entityMapper },
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
    return TestBed.inject(Database).destroy();
  });

  it("should be created", () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it("should start tracking with config from db", fakeAsync(() => {
    environment.production = true; // tracking is only active in production mode
    const testConfig = new Config(Config.CONFIG_KEY, {
      [USAGE_ANALYTICS_CONFIG_ID]: {
        url: "matomo-test-endpoint",
        site_id: "101",
      },
    });
    entityUpdates.next({ entity: testConfig, type: "new" });
    const angulartics = TestBed.inject(Angulartics2Matomo);
    const startTrackingSpy = spyOn(angulartics, "startTracking");
    window["_paq"] = [];

    createComponent();
    tick();

    expect(startTrackingSpy).toHaveBeenCalledTimes(1);
    expect(window["_paq"]).toContain([
      "setSiteId",
      testConfig.data[USAGE_ANALYTICS_CONFIG_ID].site_id,
    ]);

    discardPeriodicTasks();
    flush();
  }));
});
