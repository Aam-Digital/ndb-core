import { Component } from "@angular/core";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { Route, Router } from "@angular/router";
import { ChildrenListComponent } from "../../../child-dev-project/children/children-list/children-list.component";
import { ConfigService } from "../config.service";
import { LoggingService } from "../../logging/logging.service";

import { RouterService } from "./router.service";
import { ViewConfig } from "./view-config.interface";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { ApplicationLoadingComponent } from "./empty/application-loading.component";
import { NotFoundComponent } from "./not-found/not-found.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { AuthGuard } from "../../session/auth.guard";
import { RoutedViewComponent } from "../../ui/routed-view/routed-view.component";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";

class TestComponent extends Component {}

describe("RouterService", () => {
  let service: RouterService;

  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(waitForAsync(() => {
    mockLoggingService = jasmine.createSpyObj(["warn"]);

    TestBed.configureTestingModule({
      imports: [MockedTestingModule],
      providers: [{ provide: LoggingService, useValue: mockLoggingService }],
    });
    service = TestBed.inject(RouterService);
  }));

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
        canDeactivate: [jasmine.any(Function)],
        canActivate: [AuthGuard, EntityPermissionGuard],
      },
      {
        path: "child/:id",
        component: RoutedViewComponent,
        data: { component: "EntityDetails", config: testViewConfig },
        canDeactivate: [jasmine.any(Function)],
        canActivate: [AuthGuard, EntityPermissionGuard],
      },
      {
        path: "list",
        component: RoutedViewComponent,
        data: { component: "EntityList", permittedUserRoles: ["user_app"] },
        canActivate: [AuthGuard, EntityPermissionGuard, UserRoleGuard],
        canDeactivate: [jasmine.any(Function)],
      },
    ];

    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

    service.reloadRouting(testViewConfigs);

    expect(router.resetConfig).toHaveBeenCalledWith(expectedRoutes);
  });

  it("should extend a view config route of lazy loaded routes (hard coded)", () => {
    const existingRoutes: Route[] = [
      { path: "other", component: TestComponent },
      { path: "child", component: ChildrenListComponent },
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
        canDeactivate: [jasmine.any(Function)],
        data: { permittedUserRoles: ["admin_app"] },
      },
      { path: "child", component: ChildrenListComponent },
    ];

    const router = TestBed.inject(Router);
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
    const getAllConfigSpy = spyOn(
      TestBed.inject(ConfigService),
      "getAllConfigs",
    );
    getAllConfigSpy.and.returnValue(routeConfigs1);
    service.initRouting();

    getAllConfigSpy.and.returnValue(routeConfigs2);
    service.initRouting();

    const router = TestBed.inject<Router>(Router);
    expect(router.config.find((r) => r.path === "child").data).toEqual({
      component: "ChildrenList",
      config: { foo: 1 },
    });
    expect(router.config.find((r) => r.path === "child2").data).toEqual({
      component: "ChildrenList",
      config: { foo: 2 },
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
        canDeactivate: [jasmine.any(Function)],
      },
    ];
    const router = TestBed.inject<Router>(Router);
    spyOn(router, "resetConfig");

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
});
