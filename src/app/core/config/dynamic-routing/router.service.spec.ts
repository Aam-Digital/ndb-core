import { Component } from "@angular/core";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { Route, Router } from "@angular/router";
import { ConfigService } from "../config.service";
import { Logging } from "../../logging/logging.service";

import { RouterService } from "./router.service";
import { ViewConfig } from "./view-config.interface";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { ApplicationLoadingComponent } from "./empty/application-loading.component";
import { NotFoundComponent } from "./not-found/not-found.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { AuthGuard } from "../../session/auth.guard";
import { RoutedViewComponent } from "../../ui/routed-view/routed-view.component";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";
import { EntityListComponent } from "../../entity-list/entity-list/entity-list.component";

@Component({ template: "" })
class TestComponent {}

describe("RouterService", () => {
  let service: RouterService;

  beforeEach(waitForAsync(() => {
    vi.spyOn(Logging, "warn");

    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [],
    });
    service = TestBed.inject(RouterService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should keep additional routes when reloading router config", () => {
    const testRoutes = [{ path: "user", component: TestComponent }];
    const router = TestBed.inject<Router>(Router);
    vi.spyOn(router, "resetConfig");

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
        _id: "view:list",
        component: "EntityList",
        permittedUserRoles: ["user_app"],
      },
    ];
    const expectedRoutes = [
      {
        path: "child",
        component: RoutedViewComponent,
        data: { component: "ChildrenList" },
        canDeactivate: [expect.any(Function)],
        canActivate: [AuthGuard, EntityPermissionGuard],
      },
      {
        path: "child/:id",
        component: RoutedViewComponent,
        data: { component: "EntityDetails", config: testViewConfig },
        canDeactivate: [expect.any(Function)],
        canActivate: [AuthGuard, EntityPermissionGuard],
      },
      {
        path: "list",
        component: RoutedViewComponent,
        data: { component: "EntityList", permittedUserRoles: ["user_app"] },
        canActivate: [AuthGuard, EntityPermissionGuard, UserRoleGuard],
        canDeactivate: [expect.any(Function)],
      },
    ];

    const router = TestBed.inject<Router>(Router);
    vi.spyOn(router, "resetConfig");

    service.reloadRouting(testViewConfigs);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });

  it("should keep addRoutes behavior unchanged for module-local routes", () => {
    const testViewConfigs: ViewConfig[] = [
      {
        _id: "view:public-form/edit",
        component: "PublicFormEdit",
        config: { custom: true },
      },
    ];
    const expectedRoutes = [
      {
        path: "public-form/edit",
        component: RoutedViewComponent,
        data: { component: "PublicFormEdit", config: { custom: true } },
        canDeactivate: [expect.any(Function)],
        canActivate: [AuthGuard, EntityPermissionGuard],
      },
    ];
    const router = TestBed.inject<Router>(Router);
    vi.spyOn(router, "resetConfig");

    service.addRoutes(testViewConfigs);

    expect(router.resetConfig).toHaveBeenCalledWith(
      expect.arrayContaining(expectedRoutes),
    );
  });

  it("should extend a view config route of lazy loaded routes (hard coded)", () => {
    const existingRoutes: Route[] = [
      { path: "other", component: TestComponent },
      { path: "child", component: EntityListComponent },
    ];
    const testViewConfigs: ViewConfig[] = [
      {
        _id: "view:other",
        permittedUserRoles: ["admin_app"],
        lazyLoaded: true,
      },
    ];
    const expectedRoutes: Route[] = [
      {
        path: "other",
        component: TestComponent,
        canActivate: [AuthGuard, EntityPermissionGuard, UserRoleGuard],
        canDeactivate: [expect.any(Function) as any],
        data: { permittedUserRoles: ["admin_app"] },
      },
      { path: "child", component: EntityListComponent },
    ];

    const router = TestBed.inject(Router);
    vi.spyOn(router, "resetConfig");

    service.reloadRouting(testViewConfigs, existingRoutes);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });

  it("should update existing routes when config changes and prefix entity routes", () => {
    const routeConfigs1: ViewConfig[] = [
      {
        _id: "view:child",
        component: "EntityList",
        config: { entityType: "Child" },
      },
      { _id: "view:other", component: "EntityDetails" },
    ];
    const routeConfigs2: ViewConfig[] = [
      {
        _id: "view:child",
        component: "EntityList",
        config: { entityType: "Child", foo: 1 },
      },
      {
        _id: "view:child2",
        component: "EntityList",
        config: { entityType: "Child", foo: 2 },
      },
    ];
    const getAllConfigSpy = vi.spyOn(
      TestBed.inject(ConfigService),
      "getAllConfigs",
    );
    getAllConfigSpy.mockReturnValue(routeConfigs1);
    service.initRouting();

    getAllConfigSpy.mockReturnValue(routeConfigs2);
    service.initRouting();

    const router = TestBed.inject<Router>(Router);
    expect(router.config.find((r) => r.path === "c/child").data).toEqual({
      component: "EntityList",
      config: { entityType: "Child", foo: 1 },
    });
    expect(router.config.find((r) => r.path === "c/child2").data).toEqual({
      component: "EntityList",
      config: { entityType: "Child", foo: 2 },
    });
    expect(router.config.find((r) => r.path === "child")).toEqual({
      path: "child",
      pathMatch: "full",
      redirectTo: "/c/child",
    });
  });

  it("should add the user role guard if userIsPermitted is set", () => {
    const testViewConfigs: ViewConfig[] = [
      {
        _id: "view:list",
        component: "EntityList",
        permittedUserRoles: ["admin"],
      },
    ];
    const expectedRoutes = [
      {
        path: "list",
        component: RoutedViewComponent,
        data: { component: "EntityList", permittedUserRoles: ["admin"] },
        canActivate: [AuthGuard, EntityPermissionGuard, UserRoleGuard],
        canDeactivate: [expect.any(Function)],
      },
    ];
    const router = TestBed.inject<Router>(Router);
    vi.spyOn(router, "resetConfig");

    service.reloadRouting(testViewConfigs);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });

  it("should set NotFoundComponent for wildcard route", () => {
    const wildcardRoute: Route = {
      path: "**",
      component: ApplicationLoadingComponent,
    };

    service.reloadRouting([], [wildcardRoute]);

    expect(wildcardRoute).toEqual({ path: "**", component: NotFoundComponent });
  });

  it("should keep non-entity config routes unprefixed during initRouting", () => {
    const getAllConfigSpy = vi.spyOn(
      TestBed.inject(ConfigService),
      "getAllConfigs",
    );
    getAllConfigSpy.mockReturnValue([
      { _id: "view:dashboard", component: "Dashboard" },
    ]);

    service.initRouting();

    const router = TestBed.inject<Router>(Router);
    expect(router.config.find((r) => r.path === "dashboard")).toBeDefined();
  });

  it("should skip config routes that conflict with reserved fixed routes during initRouting", () => {
    const conflictingViewConfig: ViewConfig[] = [
      {
        _id: "view:import",
        component: "Import",
      },
    ];
    const getAllConfigSpy = vi.spyOn(
      TestBed.inject(ConfigService),
      "getAllConfigs",
    );
    getAllConfigSpy.mockReturnValue(conflictingViewConfig);
    const fixedImportRoute = { path: "import", component: TestComponent };

    service.reloadRouting(
      conflictingViewConfig,
      [fixedImportRoute],
      { blockReservedRouteOverrides: true },
    );

    const router = TestBed.inject<Router>(Router);
    expect(router.config.find((r) => r.path === "import")).toEqual(
      fixedImportRoute,
    );
  });
});
