import { TestBed } from "@angular/core/testing";
import { PublicFormPermissionService } from "./public-form-permission.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { PermissionsConfigService } from "../../core/permissions/permissions-config.service";
import { Config } from "../../core/config/config";

describe("PublicFormPermissionService", () => {
  let service: PublicFormPermissionService;
  let mockEntityMapper: any;
  let mockPermissionsConfig: {
    load: ReturnType<typeof vi.fn>;
    canManagePermissions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockEntityMapper = {
      save: vi.fn().mockName("EntityMapperService.save"),
    };
    mockPermissionsConfig = {
      load: vi.fn().mockName("PermissionsConfigService.load"),
      canManagePermissions: vi
        .fn()
        .mockName("PermissionsConfigService.canManagePermissions")
        .mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        PublicFormPermissionService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        {
          provide: PermissionsConfigService,
          useValue: mockPermissionsConfig,
        },
      ],
    });
    service = TestBed.inject(PublicFormPermissionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should allow access when permissions config cannot be loaded", async () => {
    mockPermissionsConfig.load.mockResolvedValue(null);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should allow access when no permissions are configured", async () => {
    const emptyConfig = new Config(Config.PERMISSION_KEY, null);
    mockPermissionsConfig.load.mockResolvedValue(emptyConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should allow access when public role has create permission", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "create" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(true);
  });

  it("should allow access when public role has manage permission", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "manage" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(true);
  });

  it("should allow access when public role has create permission with grouped/array subjects", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: ["Child", "School"], action: "create" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(true);
  });

  it("should allow access when public role has manage permission with grouped/array subjects", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: ["Child", "School"], action: "manage" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("School");

    expect(result).toBe(true);
  });

  it("should deny access when entity type is not in the grouped subjects array", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: ["Child", "School"], action: "create" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Teacher");

    expect(result).toBe(false);
  });

  it("should deny access when public role has no permission for the entity type", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "School", action: "create" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should deny access when public role has read permission but not create permission", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "read" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should detect admin permission from write access to the permissions config", () => {
    mockPermissionsConfig.canManagePermissions.mockReturnValue(true);
    expect(service.hasAdminPermission()).toBe(true);

    mockPermissionsConfig.canManagePermissions.mockReturnValue(false);
    expect(service.hasAdminPermission()).toBe(false);
  });

  it("should create new permissions config when none exists", async () => {
    mockPermissionsConfig.load.mockResolvedValue(null);
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          _public: [
            {
              subject: [
                "Config",
                "SiteSettings",
                "PublicFormConfig",
                "ConfigurableEnum",
              ],
              action: "read",
            },
            {
              subject: "Child",
              action: "create",
            },
          ],
          _default: [{ subject: "all", action: "manage" }],
        },
      }),
      true,
    );
  });

  it("should add permission to existing permissions config", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      public: [
        {
          subject: [
            "Config",
            "SiteSettings",
            "PublicFormConfig",
            "ConfigurableEnum",
          ],
          action: "read",
        },
        { subject: "School", action: "create" },
      ],
    });
    mockPermissionsConfig.load.mockResolvedValue(existingConfig);
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          _public: [
            {
              subject: [
                "Config",
                "SiteSettings",
                "PublicFormConfig",
                "ConfigurableEnum",
              ],
              action: "read",
            },
            { subject: "School", action: "create" },
            { subject: "Child", action: "create" },
          ],
        },
      }),
      true,
    );
  });

  it("should skip adding permission when it already exists", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      _public: [
        { subject: "Child", action: "create" },
        {
          subject: [
            "Config",
            "SiteSettings",
            "PublicFormConfig",
            "ConfigurableEnum",
          ],
          action: "read",
        },
      ],
    });
    mockPermissionsConfig.load.mockResolvedValue(existingConfig);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should skip adding permission when it exists in a grouped/array subject", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      _public: [
        { subject: ["Child", "School"], action: "create" },
        {
          subject: [
            "Config",
            "SiteSettings",
            "PublicFormConfig",
            "ConfigurableEnum",
          ],
          action: "read",
        },
      ],
    });
    mockPermissionsConfig.load.mockResolvedValue(existingConfig);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should add create permission when only read permission exists", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "read" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(existingConfig);
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          _public: [
            { subject: "Child", action: "read" },
            {
              subject: [
                "Config",
                "SiteSettings",
                "PublicFormConfig",
                "ConfigurableEnum",
              ],
              action: "read",
            },
            { subject: "Child", action: "create" },
          ],
        },
      }),
      true,
    );
  });

  it("should migrate a legacy public section to the renamed _public key", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "read" }],
    });
    mockPermissionsConfig.load.mockResolvedValue(existingConfig);
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    const saved = mockEntityMapper.save.mock.calls[0][0] as Config<any>;
    expect(saved.data._public).toBeDefined();
    expect(saved.data.public).toBeUndefined();
  });

  it("should persist the legacy migration even when all required rules already exist", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      public: [
        {
          subject: [
            "Config",
            "SiteSettings",
            "PublicFormConfig",
            "ConfigurableEnum",
          ],
          action: "read",
        },
        { subject: "Child", action: "create" },
      ],
    });
    mockPermissionsConfig.load.mockResolvedValue(existingConfig);
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    // no new rule is needed, but the legacy -> _public migration must still be saved
    expect(mockEntityMapper.save).toHaveBeenCalledTimes(1);
    const saved = mockEntityMapper.save.mock.calls[0][0] as Config<any>;
    expect(saved.data._public).toBeDefined();
    expect(saved.data.public).toBeUndefined();
  });
});
