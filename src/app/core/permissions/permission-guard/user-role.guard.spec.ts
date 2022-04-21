import { TestBed } from "@angular/core/testing";

import { UserRoleGuard } from "./user-role.guard";
import { SessionService } from "../../session/session-service/session.service";
import { DatabaseUser } from "../../session/session-service/local-user";

describe("UserRoleGuard", () => {
  let guard: UserRoleGuard;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  const normalUser: DatabaseUser = { name: "normalUser", roles: ["user_app"] };
  const adminUser: DatabaseUser = {
    name: "admin",
    roles: ["admin", "user_app"],
  };

  beforeEach(() => {
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        UserRoleGuard,
      ],
    });
    guard = TestBed.inject(UserRoleGuard);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should return true if current user is allowed", () => {
    mockSessionService.getCurrentUser.and.returnValue(adminUser);

    const result = guard.canActivate({
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    } as any);

    expect(result).toBeTrue();
  });

  it("should return false for a user without permissions", () => {
    mockSessionService.getCurrentUser.and.returnValue(normalUser);

    const result = guard.canActivate({
      routeConfig: { path: "url" },
      data: { permittedUserRoles: ["admin"] },
    } as any);

    expect(result).toBeFalse();
  });

  it("should return true if no config is set", () => {
    const result = guard.canActivate({ routeConfig: { path: "url" } } as any);

    expect(result).toBeTrue();
  });
});
