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
import { ConfigService } from "../../../config/config.service";
import { BehaviorSubject, Subject } from "rxjs";
import { Config } from "../../../config/config";
import { UserRoleGuard } from "../../../permissions/permission-guard/user-role.guard";
import { Event, NavigationEnd, Router } from "@angular/router";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityPermissionGuard } from "../../../permissions/permission-guard/entity-permission.guard";
import { NavigationMenuConfig } from "../menu-item";
import type { Mock } from "vitest";

type ConfigServiceMock = Pick<ConfigService, "getConfig" | "getAllConfigs"> & {
  getConfig: Mock;
  getAllConfigs: Mock;
  configUpdates: BehaviorSubject<Config>;
};

type RoutePermissionGuardMock = {
  checkRoutePermissions: Mock;
};

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  let mockConfigService: ConfigServiceMock;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockRoleGuard: RoutePermissionGuardMock;
  let mockEntityGuard: RoutePermissionGuardMock;

  beforeEach(waitForAsync(() => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = {
      getConfig: vi.fn(),
      getAllConfigs: vi.fn(),
      configUpdates: mockConfigUpdated,
    };
    mockConfigService.getConfig.mockReturnValue({ items: [] });
    mockConfigService.getAllConfigs.mockReturnValue([]);
    mockRoleGuard = {
      checkRoutePermissions: vi.fn(),
    };
    mockRoleGuard.checkRoutePermissions.mockResolvedValue(true);
    mockEntityGuard = {
      checkRoutePermissions: vi.fn(),
    };
    mockEntityGuard.checkRoutePermissions.mockResolvedValue(true);

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

  it("marks items that require admin rights", async () => {
    vi.useFakeTimers();
    try {
      const testConfig: NavigationMenuConfig = {
        items: [
          { label: "Dashboard", icon: "home", link: "/dashboard" },
          { label: "Children", icon: "child", link: "/child" },
        ],
      };
      mockRoleGuard.checkRoutePermissions.mockImplementation(
        async (route: string) => {
          switch (route) {
            case "/dashboard":
              return false;
            case "/child":
              return true;
            default:
              return false;
          }
        },
      );

      mockConfigService.getConfig.mockReturnValue(testConfig);
      mockConfigUpdated.next(null);
      await vi.advanceTimersByTimeAsync(0);

      expect(component.menuItems()).toEqual([
        { label: "Children", icon: "child", link: "/child" },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should add menu items where entity permissions are missing", async () => {
    vi.useFakeTimers();
    try {
      const testConfig: NavigationMenuConfig = {
        items: [
          { label: "Dashboard", icon: "home", link: "/dashboard" },
          { label: "Children", icon: "child", link: "/child" },
        ],
      };
      mockEntityGuard.checkRoutePermissions.mockImplementation(
        (route: string) => {
          switch (route) {
            case "/dashboard":
              return Promise.resolve(false);
            case "/child":
              return Promise.resolve(true);
            default:
              return Promise.resolve(false);
          }
        },
      );

      mockConfigService.getConfig.mockReturnValue(testConfig);
      mockConfigUpdated.next(null);
      await vi.advanceTimersByTimeAsync(0);

      expect(component.menuItems()).toEqual([
        { label: "Children", icon: "child", link: "/child" },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should highlight active menu item", () => {
    const routerEvents = TestBed.inject(Router).events as Subject<Event>;
    component.menuItems.set([
      { label: "Home", icon: "home", link: "/" },
      { label: "Children", icon: "child", link: "/child" },
    ]);

    routerEvents.next(new NavigationEnd(42, "/child/1", "/child/1"));
    expect(component.activeLink(), "url should match parent menu").toBe(
      "/child",
    );

    routerEvents.next(new NavigationEnd(42, "/", "/"));
    expect(component.activeLink(), "root url should match").toBe("/");

    routerEvents.next(new NavigationEnd(42, "/other", "/other"));
    expect(component.activeLink(), "unknown url should not match").toBe("");
  });

  it("should correctly highlight nested menu items", () => {
    const routerEvents = TestBed.inject(Router).events as Subject<Event>;
    component.menuItems.set([{ label: "Children", icon: "", link: "/child" }]);

    routerEvents.next(new NavigationEnd(42, "/child/1", "/child/1"));
    expect(component.activeLink()).toBe("/child");
  });
});
