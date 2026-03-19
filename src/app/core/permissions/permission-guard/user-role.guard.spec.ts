import { TestBed } from "@angular/core/testing";

import { UserRoleGuard } from "./user-role.guard";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRouteSnapshot, Route, Router } from "@angular/router";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";

describe("UserRoleGuard", () => {
  let guard: UserRoleGuard;
  let sessionInfo: SessionSubject;
  const normalUser: SessionInfo = {
    name: "normalUser",
    id: "1",
    roles: ["user_app"],
  };
  const adminUser: SessionInfo = {
    name: "admin",
    id: "2",
    roles: ["admin", "user_app"],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [SessionSubject, UserRoleGuard],
    });
    guard = TestBed.inject(UserRoleGuard);
    sessionInfo = TestBed.inject(SessionSubject);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should return true if current user is allowed", async () => {
    sessionInfo.next(adminUser);

    const result = await guard.canActivate({
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    } as any);

    expect(result).toBe(true);
  });

  it("should return false for a user without permissions", async () => {
    sessionInfo.next(normalUser);
    const router = TestBed.inject(Router);
    vi.spyOn(router, "navigate");

    const result = await guard.canActivate({
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    } as any);

    expect(result).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should navigate to 404 for real navigation requests without permissions", async () => {
    sessionInfo.next(normalUser);
    const router = TestBed.inject(Router);
    vi.spyOn(router, "navigate");
    const route = new ActivatedRouteSnapshot();
    Object.assign(route, {
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    });

    await guard.canActivate(route);

    expect(router.navigate).toHaveBeenCalledWith(["/404"]);
  });

  it("should return true if no config is set", async () => {
    const result = await guard.canActivate({
      routeConfig: { path: "url" },
    } as any);

    expect(result).toBe(true);
  });

  it("should check permissions of a given route (checkRoutePermissions)", async () => {
    const router = TestBed.inject(Router);
    router.config.push({
      path: "restricted",
      data: { permittedUserRoles: ["admin"] },
    });
    router.config.push({ path: "pathA", data: {} });
    // details view restricted
    router.config.push({
      path: "pathA/:id",
      data: { permittedUserRoles: ["admin"] },
    });

    sessionInfo.next(normalUser);
    await expect(guard.checkRoutePermissions("free")).resolves.toEqual(true);
    await expect(guard.checkRoutePermissions("/free")).resolves.toEqual(true);
    await expect(guard.checkRoutePermissions("restricted")).resolves.toEqual(
      false,
    );
    await expect(guard.checkRoutePermissions("pathA")).resolves.toEqual(true);
    await expect(guard.checkRoutePermissions("/pathA")).resolves.toEqual(true);
    await expect(guard.checkRoutePermissions("pathA/1")).resolves.toEqual(
      false,
    );

    sessionInfo.next(adminUser);
    await expect(guard.checkRoutePermissions("free")).resolves.toEqual(true);
    await expect(guard.checkRoutePermissions("restricted")).resolves.toEqual(
      true,
    );
    await expect(guard.checkRoutePermissions("pathA")).resolves.toEqual(true);
    await expect(guard.checkRoutePermissions("pathA/1")).resolves.toEqual(true);
  });

  it("should checkRoutePermissions considering nested child routes", async () => {
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

    sessionInfo.next(normalUser);
    await expect(guard.checkRoutePermissions("nested")).resolves.toEqual(false);
    await expect(guard.checkRoutePermissions("nested/X")).resolves.toEqual(
      true,
    );
    await expect(guard.checkRoutePermissions("on-parent")).resolves.toEqual(
      false,
    );
    await expect(guard.checkRoutePermissions("on-parent/X")).resolves.toEqual(
      false,
    );

    sessionInfo.next(adminUser);
    await expect(guard.checkRoutePermissions("nested")).resolves.toEqual(true);
    await expect(guard.checkRoutePermissions("nested/X")).resolves.toEqual(
      true,
    );
    await expect(guard.checkRoutePermissions("on-parent")).resolves.toEqual(
      true,
    );
    await expect(guard.checkRoutePermissions("on-parent/X")).resolves.toEqual(
      true,
    );
  });
});
