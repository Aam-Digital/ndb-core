import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EMPTY, of, throwError } from "rxjs";

import { RolePermissionsService } from "./role-permissions.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockEntityMapper.save.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: UserAdminService, useValue: mockUserAdmin },
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

  it("createRole creates the keycloak role and saves rules to config", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {}),
    );
    mockUserAdmin.createRole.mockReturnValue(of(undefined));

    const result = await service.createRole("field_supervisor", "Sups", [
      { subject: "Child", action: "read" },
    ]);

    expect(result.keycloakSynced).toBe(true);
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

  it("createRole still saves config when keycloak sync fails and reports it", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {}),
    );
    mockUserAdmin.createRole.mockReturnValue(
      throwError(() => new Error("403")),
    );

    const result = await service.createRole("field_supervisor", "", []);

    expect(result.keycloakSynced).toBe(false);
    const savedConfig = mockEntityMapper.save.mock.calls
      .map(([e]) => e)
      .find((e) => e.getId() === "Config:Permissions");
    expect(savedConfig.data.field_supervisor).toEqual([]);
  });

  it("deleteRole removes the config entry and deletes the keycloak role", async () => {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {
        field_supervisor: [{ subject: "Child", action: "read" }],
        user_app: [],
      }),
    );
    mockUserAdmin.deleteRole.mockReturnValue(of(undefined));

    const result = await service.deleteRole("field_supervisor");

    expect(result.keycloakSynced).toBe(true);
    expect(mockUserAdmin.deleteRole).toHaveBeenCalledWith("field_supervisor");
    const savedConfig = mockEntityMapper.save.mock.calls
      .map(([e]) => e)
      .find((e) => e.getId() === "Config:Permissions");
    expect(savedConfig.data.field_supervisor).toBeUndefined();
    expect(savedConfig.data.user_app).toEqual([]);
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
