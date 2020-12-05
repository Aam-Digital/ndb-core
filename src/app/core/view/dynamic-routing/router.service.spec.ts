import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildrenListComponent } from "app/child-dev-project/children/children-list/children-list.component";
import { AdminGuard } from "../../admin/admin.guard";
import { AdminComponent } from "../../admin/admin/admin.component";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";

import { RouterService } from "./router.service";
import { EntityDetailsComponent } from "../../entity-list/entity-details/entity-details.component";

class TestComponent extends Component {}

describe("RouterService", () => {
  let service: RouterService;

  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getAllConfigs"]);
    mockConfigService.getAllConfigs.and.returnValue([]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggingService, useValue: jasmine.createSpyObj(["warn"]) },
      ],
    });
    service = TestBed.inject(RouterService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should keep additional routes when reloading router config", () => {
    const testRoutes = [{ path: "user", component: TestComponent }];
    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

    service.reloadRouting(testRoutes);

    expect(router.resetConfig).toHaveBeenCalledWith(testRoutes);
  });

  it("should generate and add routes from config for router config", () => {
    const testViewConfig = { foo: 1 };
    const testViewConfigs = [
      { _id: "view:child", component: "ChildrenList" },
      {
        _id: "view:child/:id",
        component: "ChildDetails",
        config: testViewConfig,
      },
      { _id: "view:admin", component: "Admin", requiresAdmin: true },
    ];
    const expectedRoutes = [
      { path: "child", component: ChildrenListComponent },
      {
        path: "child/:id",
        component: EntityDetailsComponent,
        data: testViewConfig,
      },
      { path: "admin", component: AdminComponent, canActivate: [AdminGuard] },
    ];

    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

    mockConfigService.getAllConfigs.and.returnValue(testViewConfigs);
    service.reloadRouting();

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });

  it("should ignore a view config route of hard-coded route already exists", () => {
    const existingRoutes = [{ path: "other", component: TestComponent }];
    const testViewConfigs = [
      { _id: "view:child", component: "ChildrenList" },
      { _id: "view:other", component: "ChildDetails" },
    ];
    const expectedRoutes = [
      { path: "child", component: ChildrenListComponent },
      { path: "other", component: TestComponent },
    ];

    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

    mockConfigService.getAllConfigs.and.returnValue(testViewConfigs);
    service.reloadRouting(existingRoutes);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });
});
