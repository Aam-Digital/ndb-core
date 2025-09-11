import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { MenuService } from "./menu.service";
import { ConfigService } from "app/core/config/config.service";
import { Config } from "@playwright/test";
import { BehaviorSubject } from "rxjs";
import { EntityMenuItem, NavigationMenuConfig } from "./menu-item";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { ViewConfig } from "app/core/config/dynamic-routing/view-config.interface";

describe("MenuService", () => {
  let service: MenuService;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfigUpdated: BehaviorSubject<Config>;

  beforeEach(() => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = jasmine.createSpyObj(["getConfig", "getAllConfigs"], {
      configUpdates: mockConfigUpdated,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    });
    service = TestBed.inject(MenuService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should parse EntityMenuItem and keep simple MenuItem unchanged", fakeAsync(() => {
    const testConfig: NavigationMenuConfig = {
      items: [
        { label: "Home", icon: "home", link: "/" },
        {
          entityType: "TestEntity",
          subMenu: [{ label: "submenu label", entityType: "TestEntity" }],
        } as EntityMenuItem,
      ],
    };

    mockConfigService.getConfig.and.returnValue(testConfig);
    mockConfigUpdated.next(null);
    tick();

    expect(service.menuItems.value).toEqual([
      { label: "Home", icon: "home", link: "/" },
      {
        label: "Test Entities",
        icon: "child",
        link: "/test-entity",
        subMenu: [
          { label: "submenu label", icon: "child", link: "/test-entity" },
        ],
      },
    ]);
  }));

  it("should load availableRoutes from config service and skip routes with /:id", () => {
    const testView1: ViewConfig = {
      _id: "view:child",
      component: "ChildrenList",
      config: { entityType: "Child" },
    };
    const testView2: ViewConfig = {
      _id: "view:school",
      component: "EntityList",
      config: { entityType: "School" },
    };
    const testView3: ViewConfig = {
      _id: "view:note/:id",
      component: "NoteDetails",
      config: { entityType: "Note" },
    };
    const testView4: ViewConfig = {
      _id: "view:",
      component: "Dashboard",
      config: { widgets: [] },
    };

    mockConfigService.getAllConfigs.and.returnValue([
      testView1,
      testView2,
      testView3,
      testView4,
    ]);

    const routes = service.loadAvailableRoutes();

    expect(routes).toEqual([
      { value: "/child", label: "Child" },
      { value: "/school", label: "School" },
      { value: "/", label: "Dashboard" },
    ]);
  });
});
