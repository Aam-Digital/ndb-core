import { TestBed } from "@angular/core/testing";

import { UserRoleGuard } from "./user-role.guard";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRouteSnapshot, Route, Router } from "@angular/router";
import { AuthUser } from "../../session/auth/auth-user";
import { ConfigService } from "../../config/config.service";
import { PREFIX_VIEW_CONFIG } from "../../config/dynamic-routing/view-config.interface";
import { CurrentUserSubject } from "../../user/user";

describe("UserRoleGuard", () => {
  let guard: UserRoleGuard;
  let userSubject: CurrentUserSubject;
  const normalUser: AuthUser = { name: "normalUser", roles: ["user_app"] };
  const adminUser: AuthUser = {
    name: "admin",
    roles: ["admin", "user_app"],
  };
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        CurrentUserSubject,
        UserRoleGuard,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    });
    guard = TestBed.inject(UserRoleGuard);
    userSubject = TestBed.inject(CurrentUserSubject);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should return true if current user is allowed", () => {
    userSubject.next(adminUser);

    const result = guard.canActivate({
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    } as any);

    expect(result).toBeTrue();
  });

  it("should return false for a user without permissions", () => {
    userSubject.next(normalUser);
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");

    const result = guard.canActivate({
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    } as any);

    expect(result).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should navigate to 404 for real navigation requests without permissions", () => {
    userSubject.next(normalUser);
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    });

    guard.canActivate(route);

    expect(router.navigate).toHaveBeenCalledWith(["/404"]);
  });

  it("should return true if no config is set", () => {
    const result = guard.canActivate({ routeConfig: { path: "url" } } as any);

    expect(result).toBeTrue();
  });

  it("should check permissions of a given route (checkRoutePermissions)", () => {
    mockConfigService.getConfig.and.callFake((id) => {
      switch (id) {
        case PREFIX_VIEW_CONFIG + "restricted":
          return { permittedUserRoles: ["admin"] } as any;
        case PREFIX_VIEW_CONFIG + "pathA":
          return {} as any;
        case PREFIX_VIEW_CONFIG + "pathA/:id":
          // details view restricted
          return { permittedUserRoles: ["admin"] } as any;
      }
    });

    userSubject.next(normalUser);
    expect(guard.checkRoutePermissions("free")).toBeTrue();
    expect(guard.checkRoutePermissions("/free")).toBeTrue();
    expect(guard.checkRoutePermissions("restricted")).toBeFalse();
    expect(guard.checkRoutePermissions("pathA")).toBeTrue();
    expect(guard.checkRoutePermissions("/pathA")).toBeTrue();
    expect(guard.checkRoutePermissions("pathA/1")).toBeFalse();

    userSubject.next(adminUser);
    expect(guard.checkRoutePermissions("free")).toBeTrue();
    expect(guard.checkRoutePermissions("restricted")).toBeTrue();
    expect(guard.checkRoutePermissions("pathA")).toBeTrue();
    expect(guard.checkRoutePermissions("pathA/1")).toBeTrue();
  });

  it("should checkRoutePermissions considering nested child routes", () => {
    const nestedRoute: Route = {
      path: "nested",
      children: [
        { path: "", data: { permittedUserRoles: ["admin"] } },
        { path: "X", data: {} },
      ],
    };
    const onParentRoute: Route = {
      path: "on-parent",
      children: [{ path: "" }, { path: "X" }],
      data: { permittedUserRoles: ["admin"] },
    };

    const router = TestBed.inject(Router);
    router.config.push(nestedRoute);
    router.config.push(onParentRoute);

    userSubject.next(normalUser);
    expect(guard.checkRoutePermissions("nested")).toBeFalse();
    expect(guard.checkRoutePermissions("nested/X")).toBeTrue();
    expect(guard.checkRoutePermissions("on-parent")).toBeFalse();
    expect(guard.checkRoutePermissions("on-parent/X")).toBeFalse();

    userSubject.next(adminUser);
    expect(guard.checkRoutePermissions("nested")).toBeTrue();
    expect(guard.checkRoutePermissions("nested/X")).toBeTrue();
    expect(guard.checkRoutePermissions("on-parent")).toBeTrue();
    expect(guard.checkRoutePermissions("on-parent/X")).toBeTrue();
  });
});
