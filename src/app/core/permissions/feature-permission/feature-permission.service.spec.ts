import { TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { FeaturePermissionService } from "./feature-permission.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "../../session/auth/session-info";
import { Config } from "../../config/config";
import { DatabaseRules } from "../permission-types";

describe("FeaturePermissionService", () => {
  let service: FeaturePermissionService;
  let mockEntityMapper: {
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let mockSessionSubject: BehaviorSubject<any>;

  const ENTITY_TYPE = "EmailTemplate";

  function mockConfig(data: DatabaseRules | null) {
    mockEntityMapper.load.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, data),
    );
  }

  /** the data of the (second) save call - the updated permissions config */
  function savedPermissions(): DatabaseRules {
    const configSaveCall = mockEntityMapper.save.mock.calls.find(
      ([c]) => c._id === `Config:${Config.PERMISSION_KEY}`,
    );
    return configSaveCall[0].data;
  }

  beforeEach(() => {
    mockEntityMapper = {
      load: vi.fn().mockName("EntityMapperService.load"),
      save: vi
        .fn()
        .mockName("EntityMapperService.save")
        .mockResolvedValue(undefined),
    };
    mockSessionSubject = new BehaviorSubject(null);

    TestBed.configureTestingModule({
      providers: [
        FeaturePermissionService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: SessionSubject, useValue: mockSessionSubject },
      ],
    });
    service = TestBed.inject(FeaturePermissionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("hasAdminPermission", () => {
    it("should be true only when the user has the admin_app role", () => {
      mockSessionSubject.next({ roles: ["admin_app", "user_app"] });
      expect(service.hasAdminPermission()).toBe(true);

      mockSessionSubject.next({ roles: ["user_app"] });
      expect(service.hasAdminPermission()).toBe(false);

      mockSessionSubject.next(null);
      expect(service.hasAdminPermission()).toBe(false);
    });
  });

  describe("getPermissions", () => {
    it("should report an editable no-access row for a role without any rule", async () => {
      mockConfig({ user_app: [] });

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(state.roles).toEqual([
        { role: "user_app", use: false, manage: false, editable: true },
      ]);
      expect(state.hasComplexRules).toBe(false);
    });

    it("should report an editable no-access row when permissions config does not exist", async () => {
      mockEntityMapper.load.mockRejectedValue(new Error("not found"));

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(state.roles).toEqual([
        { role: "user_app", use: false, manage: false, editable: true },
      ]);
    });

    it("should read editable 'use'/'manage' from exact read and manage rules", async () => {
      mockConfig({
        user_app: [{ subject: ENTITY_TYPE, action: "read" }],
        admin_app: [{ subject: ENTITY_TYPE, action: "manage" }],
      });

      const state = await service.getPermissions(ENTITY_TYPE, [
        "user_app",
        "admin_app",
      ]);

      expect(state.roles).toEqual([
        { role: "user_app", use: true, manage: false, editable: true },
        { role: "admin_app", use: false, manage: true, editable: true },
      ]);
      expect(state.hasComplexRules).toBe(false);
    });

    it("should ignore rules for other entity types", async () => {
      mockConfig({
        user_app: [{ subject: "Child", action: "read" }],
      });

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(state.roles[0]).toEqual({
        role: "user_app",
        use: false,
        manage: false,
        editable: true,
      });
    });

    it("should ignore create/update/delete-only rules (only read/manage count)", async () => {
      mockConfig({
        user_app: [{ subject: ENTITY_TYPE, action: "create" }],
      });

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(state.roles[0]).toEqual({
        role: "user_app",
        use: false,
        manage: false,
        editable: true,
      });
      expect(state.hasComplexRules).toBe(false);
    });

    it("should show effective read-only access granted by a grouped/array subject", async () => {
      mockConfig({
        user_app: [{ subject: [ENTITY_TYPE, "Child"], action: "read" }],
      });

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(state.roles[0]).toEqual({
        role: "user_app",
        use: true,
        manage: false,
        editable: false,
      });
      expect(state.hasComplexRules).toBe(true);
    });

    it("should show effective read-only access granted by the 'all' wildcard", async () => {
      mockConfig({ admin_app: [{ subject: "all", action: "manage" }] });

      const state = await service.getPermissions(ENTITY_TYPE, ["admin_app"]);

      expect(state.roles[0]).toEqual({
        role: "admin_app",
        use: true,
        manage: true,
        editable: false,
      });
      expect(state.hasComplexRules).toBe(true);
    });

    it("should show conditioned rules as effective but read-only", async () => {
      mockConfig({
        user_app: [
          {
            subject: ENTITY_TYPE,
            action: "read",
            conditions: { active: true },
          },
        ],
      });

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(state.roles[0]).toEqual({
        role: "user_app",
        use: true,
        manage: false,
        editable: false,
      });
      expect(state.hasComplexRules).toBe(true);
    });

    it("should apply shared 'default' rules to every role as read-only access", async () => {
      mockConfig({
        default: [{ subject: [ENTITY_TYPE, "Config"], action: "read" }],
        user_app: [],
      });

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(state.roles[0]).toEqual({
        role: "user_app",
        use: true,
        manage: false,
        editable: false,
      });
      expect(state.hasComplexRules).toBe(true);
    });

    it("should reflect effective access for the shipped default config shape", async () => {
      // mirrors src/assets/base-configs/basic/Config_Permissions.json
      mockConfig({
        default: [
          { subject: ["Config", "SiteSettings"], action: "read" },
          { subject: ["NotificationConfig"], action: "manage" },
        ],
        user_app: [{ subject: "all", action: "manage" }],
        admin_app: [{ subject: "all", action: "manage" }],
      });

      const state = await service.getPermissions(ENTITY_TYPE, [
        "user_app",
        "admin_app",
        "assistant_app",
      ]);

      // the two wildcard roles already have full access -> read-only, both boxes on
      expect(state.roles[0]).toEqual({
        role: "user_app",
        use: true,
        manage: true,
        editable: false,
      });
      expect(state.roles[1]).toEqual({
        role: "admin_app",
        use: true,
        manage: true,
        editable: false,
      });
      // a custom role without a wildcard rule is editable and starts with no access
      expect(state.roles[2]).toEqual({
        role: "assistant_app",
        use: false,
        manage: false,
        editable: true,
      });
      expect(state.hasComplexRules).toBe(true);
    });
  });

  describe("setPermissions", () => {
    it("should add read and/or manage rules for the selected roles", async () => {
      mockConfig({});

      await service.setPermissions(ENTITY_TYPE, [
        { role: "user_app", use: true, manage: false },
        { role: "admin_app", use: true, manage: true },
      ]);

      expect(savedPermissions()).toEqual({
        user_app: [{ subject: ENTITY_TYPE, action: "read" }],
        admin_app: [
          { subject: ENTITY_TYPE, action: "read" },
          { subject: ENTITY_TYPE, action: "manage" },
        ],
      });
    });

    it("should remove owned rules when a role is unchecked", async () => {
      mockConfig({
        user_app: [{ subject: ENTITY_TYPE, action: "read" }],
      });

      await service.setPermissions(ENTITY_TYPE, [
        { role: "user_app", use: false, manage: false },
      ]);

      // role key removed entirely once it has no remaining rules
      expect(savedPermissions().user_app).toBeUndefined();
    });

    it("should preserve rules for other entity types and complex rules", async () => {
      mockConfig({
        user_app: [
          { subject: "Child", action: "read" },
          { subject: [ENTITY_TYPE, "Note"], action: "read" },
          { subject: ENTITY_TYPE, action: "read" },
        ],
        default: [{ subject: "all", action: "manage" }],
      });

      await service.setPermissions(ENTITY_TYPE, [
        { role: "user_app", use: false, manage: true },
      ]);

      expect(savedPermissions()).toEqual({
        user_app: [
          { subject: "Child", action: "read" },
          { subject: [ENTITY_TYPE, "Note"], action: "read" },
          { subject: ENTITY_TYPE, action: "manage" },
        ],
        default: [{ subject: "all", action: "manage" }],
      });
    });

    it("should seed a default all-access rule when no config exists yet", async () => {
      mockEntityMapper.load.mockRejectedValue(new Error("not found"));

      await service.setPermissions(ENTITY_TYPE, [
        { role: "user_app", use: true, manage: false },
      ]);

      expect(savedPermissions()).toEqual({
        default: [{ subject: "all", action: "manage" }],
        user_app: [{ subject: ENTITY_TYPE, action: "read" }],
      });
    });

    it("should store a timestamped backup of the previous config before saving", async () => {
      mockConfig({ user_app: [{ subject: ENTITY_TYPE, action: "read" }] });

      const backup = await service.setPermissions(ENTITY_TYPE, [
        { role: "user_app", use: false, manage: true },
      ]);

      expect(backup.getId()).toContain(Config.PERMISSION_KEY + ":");
      expect(backup.data).toEqual({
        user_app: [{ subject: ENTITY_TYPE, action: "read" }],
      });
      // backup saved before the updated config
      expect(mockEntityMapper.save).toHaveBeenCalledWith(backup);
    });
  });

  describe("getConfiguredRoleNames", () => {
    it("should list role keys from the config, excluding 'default' and 'public'", async () => {
      mockConfig({
        default: [{ subject: "all", action: "manage" }],
        public: [{ subject: ENTITY_TYPE, action: "read" }],
        user_app: [],
        admin_app: [],
        assistant_app: [{ subject: ENTITY_TYPE, action: "manage" }],
      });

      const roles = await service.getConfiguredRoleNames();

      expect(roles).toEqual(["user_app", "admin_app", "assistant_app"]);
    });

    it("should return an empty list when no config exists", async () => {
      mockEntityMapper.load.mockRejectedValue(new Error("not found"));

      expect(await service.getConfiguredRoleNames()).toEqual([]);
    });
  });
});
