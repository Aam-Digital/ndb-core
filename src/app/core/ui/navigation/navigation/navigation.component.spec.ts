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

import { NavigationComponent } from "./navigation.component";
import { MenuItem } from "../menu-item";
import { ConfigService } from "../../../config/config.service";
import { BehaviorSubject, Subject } from "rxjs";
import { Config } from "../../../config/config";
import { UserRoleGuard } from "../../../permissions/permission-guard/user-role.guard";
import { Event, NavigationEnd, Router } from "@angular/router";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockUserRoleGuard: jasmine.SpyObj<UserRoleGuard>;

  beforeEach(waitForAsync(() => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = jasmine.createSpyObj(["getConfig", "getAllConfigs"], {
      configUpdates: mockConfigUpdated,
    });
    mockConfigService.getConfig.and.returnValue({ items: [] });
    mockConfigService.getAllConfigs.and.returnValue([]);
    mockUserRoleGuard = jasmine.createSpyObj(["checkRoutePermissions"]);
    mockUserRoleGuard.checkRoutePermissions.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [NavigationComponent, MockedTestingModule.withState()],
      providers: [
        { provide: UserRoleGuard, useValue: mockUserRoleGuard },
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

  it("generates menu items from config", function () {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/dashboard" },
        { name: "Children", icon: "child", link: "/child" },
      ],
    };
    mockConfigService.getConfig.and.returnValue(testConfig);
    mockConfigUpdated.next(null);
    const items = component.menuItems;

    expect(items).toEqual([
      new MenuItem("Dashboard", "home", "/dashboard"),
      new MenuItem("Children", "child", "/child"),
    ]);
  });

  it("marks items that require admin rights", function () {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/dashboard" },
        { name: "Children", icon: "child", link: "/child" },
      ],
    };
    mockConfigService.getConfig.and.returnValue(testConfig);
    mockUserRoleGuard.checkRoutePermissions.and.callFake((route: string) => {
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

    expect(component.menuItems).toEqual([
      new MenuItem("Children", "child", "/child"),
    ]);
  });

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
