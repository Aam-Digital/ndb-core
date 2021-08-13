import { TestBed } from "@angular/core/testing";

import { UserRoleGuard } from "./user-role.guard";
import { ConfigService } from "../config/config.service";
import { SessionService } from "../session/session-service/session.service";
import { DatabaseUser } from "../session/session-service/local-user";
import { PREFIX_VIEW_CONFIG } from "../view/dynamic-routing/view-config.interface";

describe("UserRoleGuard", () => {
  let guard: UserRoleGuard;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  const normalUser: DatabaseUser = { name: "normalUser", roles: ["user_app"] };
  const adminUser: DatabaseUser = {
    name: "admin",
    roles: ["admin", "user_app"],
  };
  const adminRouteConfig = { permittedUserRoles: ["admin"] };

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue(adminRouteConfig);
    mockSessionService = jasmine.createSpyObj(["getCurrentDBUser"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SessionService, useValue: mockSessionService },
      ],
    });
    guard = TestBed.inject(UserRoleGuard);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should return true if current user is allowed", () => {
    mockSessionService.getCurrentDBUser.and.returnValue(adminUser);

    const result = guard.canActivate({ routeConfig: { path: "url" } } as any);

    expect(mockConfigService.getConfig).toHaveBeenCalledWith(
      PREFIX_VIEW_CONFIG + "url"
    );
    expect(result).toBeTrue();
  });

  it("should return false for a user without permissions", () => {
    mockSessionService.getCurrentDBUser.and.returnValue(normalUser);

    const result = guard.canActivate({ routeConfig: { path: "url" } } as any);

    expect(mockConfigService.getConfig).toHaveBeenCalledWith(
      PREFIX_VIEW_CONFIG + "url"
    );
    expect(result).toBeFalse();
  });

  it("should return true if no config is set", () => {
    mockConfigService.getConfig.and.returnValue({});

    const result = guard.canActivate({ routeConfig: { path: "url" } } as any);

    expect(mockConfigService.getConfig).toHaveBeenCalledWith(
      PREFIX_VIEW_CONFIG + "url"
    );
    expect(result).toBeTrue();
  });
});
