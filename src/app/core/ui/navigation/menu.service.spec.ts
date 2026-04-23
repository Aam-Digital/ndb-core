import { TestBed } from "@angular/core/testing";
import { MenuService } from "./menu.service";
import { ConfigService } from "app/core/config/config.service";
import { Config } from "@playwright/test";
import { BehaviorSubject } from "rxjs";
import { EntityMenuItem, NavigationMenuConfig } from "./menu-item";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { ViewConfig } from "app/core/config/dynamic-routing/view-config.interface";
import { EntityConfigService } from "../../entity/entity-config.service";

describe("MenuService", () => {
  let service: MenuService;

  let mockConfigService: any;
  let mockEntityConfigService: any;
  let mockEntityRegistry: any;
  let mockConfigUpdated: BehaviorSubject<Config>;

  beforeEach(() => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = {
      getConfig: vi.fn(),
      getAllConfigs: vi.fn(),
      configUpdates: mockConfigUpdated,
    };
    mockEntityConfigService = {
      getRuntimeRoute: vi.fn((entityType) => entityType.route),
    };
    mockEntityRegistry = {
      get: vi.fn().mockImplementation((entityType: string) => ({
        labelPlural: entityType === "TestEntity" ? "Test Entities" : entityType,
        icon: "child",
        route: "/test-entity",
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EntityConfigService, useValue: mockEntityConfigService },
        { provide: EntityRegistry, useValue: mockEntityRegistry },
      ],
    });
    service = TestBed.inject(MenuService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should parse EntityMenuItem and keep simple MenuItem unchanged", async () => {
    vi.useFakeTimers();
    try {
      const testConfig: NavigationMenuConfig = {
        items: [
          { label: "Home", icon: "home", link: "/" },
          {
            entityType: "TestEntity",
            subMenu: [{ label: "submenu label", entityType: "TestEntity" }],
          } as EntityMenuItem,
        ],
      };

      mockConfigService.getConfig.mockReturnValue(testConfig);
      mockConfigUpdated.next(null);
      await vi.advanceTimersByTimeAsync(0);

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
    } finally {
      vi.useRealTimers();
    }
  });

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

    mockConfigService.getAllConfigs.mockReturnValue([
      testView1,
      testView2,
      testView3,
      testView4,
    ]);

    const routes = service.loadAvailableRoutes();

    expect(routes).toEqual([
      { value: "/c/child", label: "Child" },
      { value: "/c/school", label: "School" },
      { value: "/", label: "Dashboard" },
    ]);
  });
});
