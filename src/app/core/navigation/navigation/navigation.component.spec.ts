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
import { RouterTestingModule } from "@angular/router/testing";
import { MenuItem } from "../menu-item";
import { MatDividerModule } from "@angular/material/divider";
import { MatListModule } from "@angular/material/list";
import { ConfigService } from "../../config/config.service";
import { BehaviorSubject, Subject } from "rxjs";
import { Config } from "../../config/config";
import { UserRoleGuard } from "../../permissions/user-role.guard";
import {
  ActivatedRouteSnapshot,
  Event,
  NavigationEnd,
  Router,
} from "@angular/router";
import { SessionService } from "../../session/session-service/session.service";
import { MockSessionModule } from "../../session/mock-session.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockUserRoleGuard: jasmine.SpyObj<UserRoleGuard>;

  beforeEach(
    waitForAsync(() => {
      mockConfigUpdated = new BehaviorSubject<Config>(null);
      mockConfigService = jasmine.createSpyObj(["getConfig"]);
      mockConfigService.getConfig.and.returnValue({ items: [] });
      mockConfigService.configUpdates = mockConfigUpdated;
      mockUserRoleGuard = jasmine.createSpyObj(["canActivate"]);
      mockUserRoleGuard.canActivate.and.returnValue(true);

      TestBed.configureTestingModule({
        imports: [
          RouterTestingModule,
          MatDividerModule,
          MatListModule,
          MockSessionModule.withState(),
          FontAwesomeTestingModule,
        ],
        declarations: [NavigationComponent],
        providers: [
          { provide: UserRoleGuard, useValue: mockUserRoleGuard },
          { provide: ConfigService, useValue: mockConfigService },
          SessionService,
        ],
      }).compileComponents();
    })
  );

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
    mockConfigService.getConfig.and.returnValues(
      testConfig,
      undefined,
      undefined
    );
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
    mockConfigService.getConfig.and.returnValues(
      testConfig,
      { permittedUserRoles: ["admin"] },
      undefined
    );
    mockUserRoleGuard.canActivate.and.callFake(
      (route: ActivatedRouteSnapshot) => {
        switch (route.routeConfig.path) {
          case "dashboard":
            return false;
          case "child":
            return true;
          default:
            return false;
        }
      }
    );

    mockConfigUpdated.next(null);

    expect(mockUserRoleGuard.canActivate).toHaveBeenCalledWith({
      routeConfig: { path: "dashboard" },
      data: { permittedUserRoles: ["admin"] },
    } as any);
    expect(mockUserRoleGuard.canActivate).toHaveBeenCalledWith({
      routeConfig: { path: "child" },
      data: { permittedUserRoles: undefined },
    } as any);
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
