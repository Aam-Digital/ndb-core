import { TestBed } from "@angular/core/testing";

import { UserRoleGuard } from "./user-role.guard";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRouteSnapshot, Route, Router } from "@angular/router";
import { SessionInfo } from "../../session/auth/session-info";
import { SessionSubject } from "../../user/user";

describe("UserRoleGuard", () => {
  let guard: UserRoleGuard;
  let sessionInfo: SessionSubject;
  const normalUser: SessionInfo = {
    entityId: "normalUser",
    roles: ["user_app"],
  };
  const adminUser: SessionInfo = {
    entityId: "admin",
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

    expect(result).toBeTrue();
  });

  it("should return false for a user without permissions", async () => {
    sessionInfo.next(normalUser);
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");

    const result = await guard.canActivate({
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    } as any);

    expect(result).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should navigate to 404 for real navigation requests without permissions", async () => {
    sessionInfo.next(normalUser);
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
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

    expect(result).toBeTrue();
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
    await expectAsync(guard.checkRoutePermissions("free")).toBeResolvedTo(true);
    await expectAsync(guard.checkRoutePermissions("/free")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("restricted")).toBeResolvedTo(
      false,
    );
    await expectAsync(guard.checkRoutePermissions("pathA")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("/pathA")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("pathA/1")).toBeResolvedTo(
      false,
    );

    sessionInfo.next(adminUser);
    await expectAsync(guard.checkRoutePermissions("free")).toBeResolvedTo(true);
    await expectAsync(guard.checkRoutePermissions("restricted")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("pathA")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("pathA/1")).toBeResolvedTo(
      true,
    );
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
    await expectAsync(guard.checkRoutePermissions("nested")).toBeResolvedTo(
      false,
    );
    await expectAsync(guard.checkRoutePermissions("nested/X")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("on-parent")).toBeResolvedTo(
      false,
    );
    await expectAsync(
      guard.checkRoutePermissions("on-parent/X"),
    ).toBeResolvedTo(false);

    sessionInfo.next(adminUser);
    await expectAsync(guard.checkRoutePermissions("nested")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("nested/X")).toBeResolvedTo(
      true,
    );
    await expectAsync(guard.checkRoutePermissions("on-parent")).toBeResolvedTo(
      true,
    );
    await expectAsync(
      guard.checkRoutePermissions("on-parent/X"),
    ).toBeResolvedTo(true);
  });
});
