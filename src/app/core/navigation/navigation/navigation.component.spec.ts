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

import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { NavigationComponent } from "./navigation.component";
import { RouterTestingModule } from "@angular/router/testing";
import { MockSessionService } from "../../session/session-service/mock-session.service";
import { MenuItem } from "../menu-item";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { RouterService } from "../../view/dynamic-routing/router.service";
import { ConfigService } from "../../config/config.service";
import { SessionService } from "../../session/session-service/session.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  let sessionService: MockSessionService;

  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue({ items: [] });

    sessionService = new MockSessionService(new EntitySchemaService());

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatIconModule,
        MatDividerModule,
        MatListModule,
      ],
      declarations: [NavigationComponent],
      providers: [
        { provide: SessionService, useValue: sessionService },
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

    component.ngOnInit();
    const items = component.menuItems;

    expect(items).toEqual([
      new MenuItem("Dashboard", "home", ["/dashboard"]),
      new MenuItem("Children", "child", ["/child"]),
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

    component.ngOnInit();
    expect(component.menuItems).toEqual([
      new MenuItem("Children", "child", ["/child"]),
    ]);
  });
});
