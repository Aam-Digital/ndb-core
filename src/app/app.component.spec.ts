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
import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";
import { environment } from "../environments/environment";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { DatabaseResolverService } from "./core/database/database-resolver.service";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  const intervalBefore = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeEach(waitForAsync(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    environment.demo_mode = true;
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(waitForAsync(() => {
    environment.demo_mode = false;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = intervalBefore;
    return TestBed.inject(DatabaseResolverService).destroyDatabases();
  }));

  it("should be created", () => {
    expect(component).toBeTruthy();
  });
});
