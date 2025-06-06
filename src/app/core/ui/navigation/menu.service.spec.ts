import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { MenuService } from "./menu.service";
import { ConfigService } from "app/core/config/config.service";
import { Config } from "@playwright/test";
import { BehaviorSubject } from "rxjs";
import { NavigationMenuConfig, EntityMenuItem } from "./menu-item";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";

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
        { entityType: "TestEntity" } as EntityMenuItem,
      ],
    };

    mockConfigService.getConfig.and.returnValue(testConfig);
    mockConfigUpdated.next(null);
    tick();

    expect(service.menuItems.value).toEqual([
      { label: "Home", icon: "home", link: "/" },
      { label: "Test Entities", icon: "child", link: "/test-entity" },
    ]);
  }));
});
