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
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { NavigationComponent } from "./navigation.component";
import { ConfigService } from "../../../config/config.service";
import { BehaviorSubject, Subject } from "rxjs";
import { Config } from "../../../config/config";
import { UserRoleGuard } from "../../../permissions/permission-guard/user-role.guard";
import { Event, NavigationEnd, Router } from "@angular/router";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityPermissionGuard } from "../../../permissions/permission-guard/entity-permission.guard";
import { NavigationMenuConfig } from "../menu-item";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockRoleGuard: jasmine.SpyObj<UserRoleGuard>;
  let mockEntityGuard: jasmine.SpyObj<EntityPermissionGuard>;

  beforeEach(waitForAsync(() => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = jasmine.createSpyObj(["getConfig", "getAllConfigs"], {
      configUpdates: mockConfigUpdated,
    });
    mockConfigService.getConfig.and.returnValue({ items: [] });
    mockConfigService.getAllConfigs.and.returnValue([]);
    mockRoleGuard = jasmine.createSpyObj(["checkRoutePermissions"]);
    mockRoleGuard.checkRoutePermissions.and.resolveTo(true);
    mockEntityGuard = jasmine.createSpyObj(["checkRoutePermissions"]);
    mockEntityGuard.checkRoutePermissions.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [NavigationComponent, MockedTestingModule.withState()],
      providers: [
        { provide: UserRoleGuard, useValue: mockRoleGuard },
        { provide: EntityPermissionGuard, useValue: mockEntityGuard },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("marks items that require admin rights", fakeAsync(() => {
    const testConfig: NavigationMenuConfig = {
      items: [
        { label: "Dashboard", icon: "home", link: "/dashboard" },
        { label: "Children", icon: "child", link: "/child" },
      ],
    };
    mockRoleGuard.checkRoutePermissions.and.callFake(async (route: string) => {
      switch (route) {
        case "/dashboard":
          return false;
        case "/child":
          return true;
        default:
          return false;
      }
    });

    mockConfigService.getConfig.and.returnValue(testConfig);
    mockConfigUpdated.next(null);
    tick();

    expect(component.menuItems).toEqual([
      { label: "Children", icon: "child", link: "/child" },
    ]);
  }));

  it("should add menu items where entity permissions are missing", fakeAsync(() => {
    const testConfig: NavigationMenuConfig = {
      items: [
        { label: "Dashboard", icon: "home", link: "/dashboard" },
        { label: "Children", icon: "child", link: "/child" },
      ],
    };
    mockEntityGuard.checkRoutePermissions.and.callFake((route: string) => {
      switch (route) {
        case "/dashboard":
          return Promise.resolve(false);
        case "/child":
          return Promise.resolve(true);
        default:
          return Promise.resolve(false);
      }
    });

    mockConfigService.getConfig.and.returnValue(testConfig);
    mockConfigUpdated.next(null);
    tick();

    expect(component.menuItems).toEqual([
      { label: "Children", icon: "child", link: "/child" },
    ]);
  }));

  it("should highlight active menu item", () => {
    const routerEvents = TestBed.inject(Router).events as Subject<Event>;
    component.menuItems = [
      { label: "Home", icon: "home", link: "/" },
      { label: "Children", icon: "child", link: "/child" },
    ];

    routerEvents.next(new NavigationEnd(42, "/child/1", "/child/1"));
    expect(component.activeLink)
      .withContext("url should match parent menu")
      .toBe("/child");

    routerEvents.next(new NavigationEnd(42, "/", "/"));
    expect(component.activeLink).withContext("root url should match").toBe("/");

    routerEvents.next(new NavigationEnd(42, "/other", "/other"));
    expect(component.activeLink)
      .withContext("unknown url should not match")
      .toBe("");
  });

  it("should correctly highlight nested menu items", () => {
    const routerEvents = TestBed.inject(Router).events as Subject<Event>;
    component.menuItems = [{ label: "Children", icon: "", link: "/child" }];

    routerEvents.next(new NavigationEnd(42, "/child/1", "/child/1"));
    expect(component.activeLink).toBe("/child");
  });
});
