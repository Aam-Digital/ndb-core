import { TestBed } from "@angular/core/testing";
import { PublicFormPermissionService } from "./public-form-permission.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "../../core/session/auth/session-info";
import { Config } from "../../core/config/config";
import { BehaviorSubject } from "rxjs";

describe("PublicFormPermissionService", () => {
  let service: PublicFormPermissionService;
  let mockEntityMapper: any;
  let mockSessionSubject: BehaviorSubject<any>;

  beforeEach(() => {
    mockEntityMapper = {
      load: vi.fn().mockName("EntityMapperService.load"),
      save: vi.fn().mockName("EntityMapperService.save"),
    };
    mockSessionSubject = new BehaviorSubject(null);

    TestBed.configureTestingModule({
      providers: [
        PublicFormPermissionService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: SessionSubject, useValue: mockSessionSubject },
      ],
    });
    service = TestBed.inject(PublicFormPermissionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should allow access when permissions config cannot be loaded", async () => {
    mockEntityMapper.load.mockRejectedValue(new Error("Config not found"));

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should allow access when no permissions are configured", async () => {
    const emptyConfig = new Config(Config.PERMISSION_KEY, null);
    mockEntityMapper.load.mockResolvedValue(emptyConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should allow access when public role has create permission", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "create" }],
    });
    mockEntityMapper.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(true);
  });

  it("should allow access when public role has manage permission", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "manage" }],
    });
    mockEntityMapper.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(true);
  });

  it("should allow access when public role has create permission with grouped/array subjects", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: ["Child", "School"], action: "create" }],
    });
    mockEntityMapper.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(true);
  });

  it("should allow access when public role has manage permission with grouped/array subjects", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: ["Child", "School"], action: "manage" }],
    });
    mockEntityMapper.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("School");

    expect(result).toBe(true);
  });

  it("should deny access when entity type is not in the grouped subjects array", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: ["Child", "School"], action: "create" }],
    });
    mockEntityMapper.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Teacher");

    expect(result).toBe(false);
  });

  it("should deny access when public role has no permission for the entity type", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "School", action: "create" }],
    });
    mockEntityMapper.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should deny access when public role has read permission but not create permission", async () => {
    const permissionsConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "read" }],
    });
    mockEntityMapper.load.mockResolvedValue(permissionsConfig);

    const result = await service.hasPublicCreatePermission("Child");

    expect(result).toBe(false);
  });

  it("should detect admin permission when user has admin_app role", () => {
    mockSessionSubject.next({ roles: ["admin_app", "user"] });

    const result = service.hasAdminPermission();

    expect(result).toBe(true);
  });

  it("should not detect admin permission when user lacks admin_app role", () => {
    mockSessionSubject.next({ roles: ["user", "viewer"] });

    const result = service.hasAdminPermission();

    expect(result).toBe(false);
  });

  it("should not detect admin permission when no session exists", () => {
    mockSessionSubject.next(null);

    const result = service.hasAdminPermission();

    expect(result).toBe(false);
  });

  it("should create new permissions config when none exists", async () => {
    mockEntityMapper.load.mockRejectedValue(new Error("Config not found"));
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
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
            {
              subject: "Child",
              action: "create",
            },
          ],
          default: [{ subject: "all", action: "manage" }],
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
    mockEntityMapper.load.mockResolvedValue(existingConfig);
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
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
            { subject: "Child", action: "create" },
          ],
        },
      }),
      true,
    );
  });

  it("should skip adding permission when it already exists", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      public: [
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
    mockEntityMapper.load.mockResolvedValue(existingConfig);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should skip adding permission when it exists in a grouped/array subject", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      public: [
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
    mockEntityMapper.load.mockResolvedValue(existingConfig);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should add create permission when only read permission exists", async () => {
    const existingConfig = new Config(Config.PERMISSION_KEY, {
      public: [{ subject: "Child", action: "read" }],
    });
    mockEntityMapper.load.mockResolvedValue(existingConfig);
    mockEntityMapper.save.mockResolvedValue(undefined);

    await service.addPublicCreatePermission("Child");

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          public: [
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
});
