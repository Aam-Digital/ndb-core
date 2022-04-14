import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildrenListComponent } from "../../../child-dev-project/children/children-list/children-list.component";
import { AdminComponent } from "../../admin/admin/admin.component";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";

import { RouterService } from "./router.service";
import { EntityDetailsComponent } from "../../entity-components/entity-details/entity-details.component";
import { ViewConfig } from "./view-config.interface";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { RouteRegistry, routesRegistry } from "../../../app.routing";

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
        { provide: RouteRegistry, useValue: routesRegistry },
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

    service.reloadRouting([], testRoutes);

    expect(router.resetConfig).toHaveBeenCalledWith(testRoutes);
  });

  it("should generate and add routes from config for router config", () => {
    const testViewConfig = { foo: 1 };
    const testViewConfigs: ViewConfig[] = [
      { _id: "view:child", component: "ChildrenList" },
      {
        _id: "view:child/:id",
        component: "EntityDetails",
        config: testViewConfig,
      },
      {
        _id: "view:admin",
        component: "Admin",
        permittedUserRoles: ["user_app"],
      },
    ];
    const expectedRoutes = [
      { path: "child", component: ChildrenListComponent, data: {} },
      {
        path: "child/:id",
        component: EntityDetailsComponent,
        data: { config: testViewConfig },
      },
      {
        path: "admin",
        component: AdminComponent,
        canActivate: [UserRoleGuard],
        data: { permittedUserRoles: ["user_app"] },
      },
    ];

    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

    service.reloadRouting(testViewConfigs);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });

  it("should ignore a view config route of hard-coded route already exists", () => {
    const existingRoutes = [{ path: "other", component: TestComponent }];
    const testViewConfigs = [
      { _id: "view:child", component: "ChildrenList" },
      { _id: "view:other", component: "EntityDetails" },
    ];
    const expectedRoutes = [
      { path: "child", component: ChildrenListComponent, data: {} },
      { path: "other", component: TestComponent },
    ];

    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

    service.reloadRouting(testViewConfigs, existingRoutes);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });

  it("should update existing routes when config changes", () => {
    const routeConfigs1: ViewConfig[] = [
      { _id: "view:child", component: "ChildrenList" },
      { _id: "view:other", component: "EntityDetails" },
    ];
    const routeConfigs2: ViewConfig[] = [
      { _id: "view:child", component: "ChildrenList", config: { foo: 1 } },
      { _id: "view:child2", component: "ChildrenList", config: { foo: 2 } },
    ];

    mockConfigService.getAllConfigs.and.returnValue(routeConfigs1);
    service.initRouting();

    mockConfigService.getAllConfigs.and.returnValue(routeConfigs2);
    service.initRouting();

    const router = TestBed.inject<Router>(Router);
    expect(router.config.find((r) => r.path === "child").data).toEqual({
      config: { foo: 1 },
    });
    expect(router.config.find((r) => r.path === "child2").data).toEqual({
      config: { foo: 2 },
    });
  });

  it("should add the user role guard if userIsPermitted is set", () => {
    const testViewConfigs: ViewConfig[] = [
      { _id: "view:admin", component: "Admin", permittedUserRoles: ["admin"] },
    ];
    const expectedRoutes = [
      {
        path: "admin",
        component: AdminComponent,
        canActivate: [UserRoleGuard],
        data: { permittedUserRoles: ["admin"] },
      },
    ];
    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

    service.reloadRouting(testViewConfigs);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });
});
