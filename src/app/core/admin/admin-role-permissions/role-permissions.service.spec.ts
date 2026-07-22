import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EMPTY, of, throwError } from "rxjs";

import { RolePermissionsService } from "./role-permissions.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";
import { SessionSubject } from "../../session/auth/session-info";
import { Config } from "../../config/config";

describe("RolePermissionsService", () => {
  let service: RolePermissionsService;
  const mockEntityMapper = {
    load: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  const mockUserAdmin = {
    getAllRoles: vi.fn(),
    createRole: vi.fn(),
    deleteRole: vi.fn(),
    updateRole: vi.fn(),
  };
  const sessionInfo = new SessionSubject();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEntityMapper.save.mockResolvedValue(undefined);
    sessionInfo.next({
      id: "admin",
      name: "admin",
      roles: [],
      realmManagementRoles: ["manage-realm"],
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: UserAdminService, useValue: mockUserAdmin },
        { provide: SessionSubject, useValue: sessionInfo },
        {
          provide: MatSnackBar,
          useValue: { open: () => ({ onAction: () => EMPTY }) },
        },
      ],
    });
    service = TestBed.inject(RolePermissionsService);
  });

  it("merges config role keys with keycloak roles and marks default/public as virtual", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {
        default: [{ subject: "Child", action: "read" }],
        user_app: [{ subject: "all", action: "manage" }],
      }),
    );
    mockUserAdmin.getAllRoles.mockReturnValue(
      of([
        { id: "1", name: "user_app", description: "Social workers" },
        { id: "2", name: "volunteer", description: "Part-time volunteers" },
      ]),
    );

    const roles = await service.loadRoles();

    expect(roles.map((r) => r.name)).toEqual([
      "default",
      "public",
      "user_app",
      "volunteer",
    ]);
    expect(roles.find((r) => r.name === "default").isVirtual).toBe(true);
    expect(roles.find((r) => r.name === "public").isVirtual).toBe(true);
    expect(roles.find((r) => r.name === "user_app").isVirtual).toBe(false);
    expect(roles.find((r) => r.name === "volunteer").rules).toBeUndefined();
    expect(roles.find((r) => r.name === "user_app").description).toBe(
      "Social workers",
    );
    expect(roles.find((r) => r.name === "user_app").rules).toEqual([
      { subject: "all", action: "manage" },
    ]);
  });

  it("returns default and public even when Config:Permissions does not exist and still lists keycloak roles", async () => {
    mockEntityMapper.load.mockRejectedValue({ status: 404 });
    mockUserAdmin.getAllRoles.mockReturnValue(
      of([{ id: "2", name: "volunteer" }]),
    );

    const roles = await service.loadRoles();

    expect(roles.map((r) => r.name)).toEqual([
      "default",
      "public",
      "volunteer",
    ]);
  });

  it("lists config-only roles even when keycloak roles cannot be loaded", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, { user_app: [] }),
    );
    mockUserAdmin.getAllRoles.mockReturnValue(
      throwError(() => new Error("403")),
    );

    const roles = await service.loadRoles();

    expect(roles.map((r) => r.name)).toContain("user_app");
  });

  it("createRole creates the keycloak role first and then saves rules to config", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {}),
    );
    mockUserAdmin.createRole.mockReturnValue(of(undefined));

    await service.createRole("field_supervisor", "Sups", [
      { subject: "Child", action: "read" },
    ]);

    expect(mockUserAdmin.createRole).toHaveBeenCalledWith({
      name: "field_supervisor",
      description: "Sups",
    });
    const savedConfig = mockEntityMapper.save.mock.calls
      .map(([e]) => e)
      .find((e) => e.getId() === "Config:Permissions");
    expect(savedConfig.data.field_supervisor).toEqual([
      { subject: "Child", action: "read" },
    ]);
  });

  it("createRole fails hard and writes nothing to config when the keycloak role cannot be created", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {}),
    );
    mockUserAdmin.createRole.mockReturnValue(
      throwError(() => new Error("403")),
    );

    await expect(
      service.createRole("field_supervisor", "", []),
    ).rejects.toThrow("403");

    const savedConfig = mockEntityMapper.save.mock.calls
      .map(([e]) => e)
      .find((e) => e.getId() === "Config:Permissions");
    expect(savedConfig).toBeUndefined();
  });

  it("deleteRole deletes the keycloak role first and then removes the config entry", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {
        field_supervisor: [{ subject: "Child", action: "read" }],
        user_app: [],
      }),
    );
    mockUserAdmin.deleteRole.mockReturnValue(of(undefined));

    await service.deleteRole("field_supervisor");

    expect(mockUserAdmin.deleteRole).toHaveBeenCalledWith("field_supervisor");
    const savedConfig = mockEntityMapper.save.mock.calls
      .map(([e]) => e)
      .find((e) => e.getId() === "Config:Permissions");
    expect(savedConfig.data.field_supervisor).toBeUndefined();
    expect(savedConfig.data.user_app).toEqual([]);
  });

  it("deleteRole fails hard and leaves the config untouched when the keycloak role cannot be deleted", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {
        field_supervisor: [{ subject: "Child", action: "read" }],
      }),
    );
    mockUserAdmin.deleteRole.mockReturnValue(
      throwError(() => new Error("403")),
    );

    await expect(service.deleteRole("field_supervisor")).rejects.toThrow("403");

    const savedConfig = mockEntityMapper.save.mock.calls
      .map(([e]) => e)
      .find((e) => e.getId() === "Config:Permissions");
    expect(savedConfig).toBeUndefined();
  });

  it("canManageRoles reflects the realm-management roles in the session", () => {
    expect(service.canManageRoles()).toBe(true);

    sessionInfo.next({
      id: "u",
      name: "u",
      roles: [],
      realmManagementRoles: ["manage-users"],
    });
    expect(service.canManageRoles()).toBe(false);

    // unknown capability (token without client roles) is treated as allowed
    sessionInfo.next({ id: "u", name: "u", roles: [] });
    expect(service.canManageRoles()).toBe(true);
  });

  it("saveRules writes timestamped backup config before saving updated permissions", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {
        user_app: [{ subject: "all", action: "manage" }],
      }),
    );

    await service.saveRules("user_app", [{ subject: "Child", action: "read" }]);

    const saved = mockEntityMapper.save.mock.calls.map(([e]) => e);
    expect(saved.length).toBe(2);
    expect(saved[0].getId()).toMatch(/^Config:Permissions:/);
    expect(saved[0].data).toEqual({
      user_app: [{ subject: "all", action: "manage" }],
    });
    expect(saved[1].getId()).toBe("Config:Permissions");
    expect(saved[1].data).toEqual({
      user_app: [{ subject: "Child", action: "read" }],
    });
  });
});
