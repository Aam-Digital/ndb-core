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
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { RouterService } from "../../view/dynamic-routing/router.service";
import { ConfigService } from "../../config/config.service";
import { BehaviorSubject, Subject } from "rxjs";
import { Config } from "../../config/config";
import { AdminGuard } from "../../admin/admin.guard";
import { Event, NavigationEnd, Router } from "@angular/router";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  const mockRouterEvents = new Subject<Event>();
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  const mockConfigUpdated = new BehaviorSubject<Config>(null);
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAdminGuard: jasmine.SpyObj<AdminGuard>;

  beforeEach(
    waitForAsync(() => {
      mockConfigService = jasmine.createSpyObj(["getConfig"]);
      mockConfigService.getConfig.and.returnValue({ items: [] });
      mockConfigService.configUpdated = mockConfigUpdated;
      mockAdminGuard = jasmine.createSpyObj(["isAdmin"]);
      mockAdminGuard.isAdmin.and.returnValue(false);
      mockRouter = jasmine.createSpyObj("Router", [], {
        url: "/",
        events: mockRouterEvents,
      });

      TestBed.configureTestingModule({
        imports: [MatIconModule, MatDividerModule, MatListModule],
        declarations: [NavigationComponent],
        providers: [
          { provide: AdminGuard, useValue: mockAdminGuard },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: Router, useValue: mockRouter },
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
    mockConfigService.getConfig.and.returnValue(testConfig);
    mockConfigUpdated.next(null);
    const items = component.menuItems;

    expect(items).toEqual([
      { name: "Dashboard", icon: "home", link: "/dashboard" },
      { name: "Children", icon: "child", link: "/child" },
    ]);
  });

  it("marks items that require admin rights", function () {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/dashboard" },
        { name: "Children", icon: "child", link: "/child" },
      ],
    };

    mockConfigService.getConfig.and.callFake((id) => {
      switch (id) {
        case RouterService.PREFIX_VIEW_CONFIG + "dashboard":
          return { requiresAdmin: true } as any;
        case RouterService.PREFIX_VIEW_CONFIG + "child":
          return { requiresAdmin: false } as any;
        default:
          return testConfig;
      }
    });
    mockConfigUpdated.next(null);

    expect(component.menuItems).toEqual([
      { name: "Children", icon: "child", link: "/child" },
    ]);
  });

  it("marks the correct route for multiple scenarios", fakeAsync(() => {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/" },
        { name: "Children", icon: "child", link: "/child" },
        {
          name: "Record Attendance",
          icon: "calendar-check-o",
          link: "/attendance/add/day",
        },
        {
          name: "Manage Attendance",
          icon: "table",
          link: "/attendance",
        },
      ],
    };
    mockConfigService.getConfig.and.returnValue(testConfig);
    mockConfigUpdated.next(null);
    tick();
    const testScenarios: { url: string; expectedElement: string }[] = [
      {
        url: "/",
        expectedElement: "Dashboard",
      },
      {
        url: "/child",
        expectedElement: "Children",
      },
      {
        url: "/child/7",
        expectedElement: "Children",
      },
      {
        url: "/attendance/add/day",
        expectedElement: "Record Attendance",
      },
      {
        url: "/attendance",
        expectedElement: "Manage Attendance",
      },
    ];
    testScenarios.forEach(({ url, expectedElement }) => {
      mockRouterEvents.next(new NavigationEnd(0, url, ""));
      tick();
      expect(component.activeElement).toEqual(expectedElement);
    });
  }));
});
