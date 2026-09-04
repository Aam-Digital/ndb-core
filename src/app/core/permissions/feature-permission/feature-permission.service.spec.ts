import { TestBed } from "@angular/core/testing";
import {
  FeatureAction,
  FeaturePermissionService,
} from "./feature-permission.service";
import { PermissionsConfigService } from "../permissions-config.service";
import { Config } from "../../config/config";
import { DatabaseRules } from "../permission-types";

describe("FeaturePermissionService", () => {
  let service: FeaturePermissionService;
  let mockPermissionsConfig: {
    load: ReturnType<typeof vi.fn>;
    saveWithBackup: ReturnType<typeof vi.fn>;
  };

  const ENTITY_TYPE = "EmailTemplate";

  /** make the stored permissions config contain the given rules (null = no config yet) */
  function mockConfig(data: DatabaseRules | null) {
    mockPermissionsConfig.load.mockResolvedValue(
      data === null ? null : new Config(Config.PERMISSION_KEY, data),
    );
  }

  /** the rules handed to the shared service to be persisted */
  function savedPermissions(): DatabaseRules {
    return mockPermissionsConfig.saveWithBackup.mock.calls.at(-1)[1];
  }

  /** which actions of a row are granted / editable, as a compact string per action */
  function summarize(row: {
    actions: Record<FeatureAction, { granted: boolean; editable: boolean }>;
  }): Record<FeatureAction, string> {
    return Object.fromEntries(
      Object.entries(row.actions).map(([action, state]) => [
        action,
        `${state.granted ? "granted" : "-"}/${state.editable ? "editable" : "locked"}`,
      ]),
    ) as Record<FeatureAction, string>;
  }

  /** all four actions in the same state, for the common all-or-nothing rows */
  function allActions(state: string): Record<FeatureAction, string> {
    return {
      create: state,
      read: state,
      update: state,
      delete: state,
    };
  }

  /** the update object expected by setPermissions */
  function actions(
    ...granted: FeatureAction[]
  ): Record<FeatureAction, boolean> {
    return {
      create: granted.includes("create"),
      read: granted.includes("read"),
      update: granted.includes("update"),
      delete: granted.includes("delete"),
    };
  }

  beforeEach(() => {
    mockPermissionsConfig = {
      load: vi.fn().mockName("PermissionsConfigService.load"),
      saveWithBackup: vi
        .fn()
        .mockName("PermissionsConfigService.saveWithBackup")
        .mockImplementation((config: Config<DatabaseRules>) =>
          Promise.resolve(
            new Config(
              Config.PERMISSION_KEY + ":2026-08-03_10-00-00",
              structuredClone(config.data),
            ),
          ),
        ),
    };

    TestBed.configureTestingModule({
      providers: [
        FeaturePermissionService,
        {
          provide: PermissionsConfigService,
          useValue: mockPermissionsConfig,
        },
      ],
    });
    service = TestBed.inject(FeaturePermissionService);
  });

  it("should show an editable row without access for a role that has no matching rule", async () => {
    mockConfig({
      user_app: [
        { subject: "Child", action: "read" },
        { subject: ENTITY_TYPE, action: "publish" as any },
      ],
    });

    const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

    expect(summarize(state.roles[0])).toEqual(allActions("-/editable"));
  });

  it("should read granted actions from scalar, array and manage rules", async () => {
    mockConfig({
      user_app: [{ subject: ENTITY_TYPE, action: "read" }],
      assistant_app: [{ subject: ENTITY_TYPE, action: ["create", "read"] }],
      admin_app: [{ subject: ENTITY_TYPE, action: "manage" }],
    });

    const state = await service.getPermissions(ENTITY_TYPE, [
      "user_app",
      "assistant_app",
      "admin_app",
    ]);

    expect(summarize(state.roles[0])).toEqual({
      ...allActions("-/editable"),
      read: "granted/editable",
    });
    expect(summarize(state.roles[1])).toEqual({
      ...allActions("-/editable"),
      read: "granted/editable",
      create: "granted/editable",
    });
    expect(summarize(state.roles[2])).toEqual(allActions("granted/editable"));
  });

  it.each([
    ["wildcard subject", { subject: "all", action: "manage" }],
    ["grouped subject", { subject: [ENTITY_TYPE, "Child"], action: "manage" }],
    [
      "conditioned rule",
      {
        subject: ENTITY_TYPE,
        action: "manage",
        conditions: { category: "public" },
      },
    ],
    [
      "system-default rule",
      {
        subject: ENTITY_TYPE,
        action: "manage",
        reason: "[system-default] required baseline",
      },
    ],
  ])(
    "should show effective access read-only for a role with a %s",
    async (_name, rule) => {
      mockConfig({ user_app: [rule as any] });

      const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

      expect(summarize(state.roles[0])).toEqual(allActions("granted/locked"));
      expect(state.roles[0].editable).toBe(false);
    },
  );

  it("should resolve overlapping rules the way CASL does, with the last matching rule winning", async () => {
    mockConfig({
      user_app: [
        { subject: ENTITY_TYPE, action: "manage" },
        { subject: ENTITY_TYPE, action: "delete", inverted: true },
      ],
      assistant_app: [
        { subject: ENTITY_TYPE, action: "read", inverted: true },
        { subject: ENTITY_TYPE, action: "read" },
      ],
    });

    const state = await service.getPermissions(ENTITY_TYPE, [
      "user_app",
      "assistant_app",
    ]);

    expect(summarize(state.roles[0])).toEqual({
      ...allActions("granted/locked"),
      delete: "-/locked",
    });
    expect(summarize(state.roles[1])).toEqual({
      ...allActions("-/locked"),
      read: "granted/locked",
    });
  });

  it("should lock only the actions the shared default section grants, per role", async () => {
    mockConfig({
      _default: [{ subject: ENTITY_TYPE, action: "read" }],
      user_app: [{ subject: ENTITY_TYPE, action: "create" }],
    });

    const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

    // the shared section holds only a rule this UI owns, so it can be edited
    expect(summarize(state.defaultRules)).toEqual({
      ...allActions("-/editable"),
      read: "granted/editable",
    });
    expect(state.defaultRules.editable).toBe(true);
    expect(summarize(state.roles[0])).toEqual({
      ...allActions("-/editable"),
      read: "granted/locked",
      create: "granted/editable",
    });
    // a default grant alone does not make the row read-only
    expect(state.roles[0].editable).toBe(true);
  });

  it("should show the shared default section read-only when an advanced rule decides every action", async () => {
    mockConfig({ _default: [{ subject: "all", action: "manage" }] });

    const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

    expect(summarize(state.defaultRules)).toEqual(allActions("granted/locked"));
    expect(state.defaultRules.editable).toBe(false);
    expect(state.defaultRules.actions.read.lockedBy).toBe("advanced-rule");
  });

  it("should lock only the actions a grouped-subject rule grants, leaving the rest of the row editable", async () => {
    // the shape the shipped base config uses for the shared section
    mockConfig({
      _default: [{ subject: ["Config", ENTITY_TYPE], action: "read" }],
      user_app: [],
    });

    const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

    expect(summarize(state.defaultRules)).toEqual({
      ...allActions("-/editable"),
      read: "granted/locked",
    });
    expect(state.defaultRules.editable).toBe(true);
    expect(state.roles[0].editable).toBe(true);
  });

  it("should report a role's own grant separately from what the default section adds", async () => {
    mockConfig({
      _default: [{ subject: ENTITY_TYPE, action: ["read", "update"] }],
      user_app: [{ subject: ENTITY_TYPE, action: "read" }],
    });

    const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

    // both are locked and granted, but only "read" survives removing the default
    expect(state.roles[0].actions.read.grantedByOwnRule).toBe(true);
    expect(state.roles[0].actions.update.grantedByOwnRule).toBe(false);
  });

  it("should read the legacy 'default' section as the shared default", async () => {
    mockConfig({ default: [{ subject: "all", action: "read" }] });

    const state = await service.getPermissions(ENTITY_TYPE, ["user_app"]);

    // the wildcard rule decides "read" only, the other actions stay editable
    expect(summarize(state.defaultRules)).toEqual({
      ...allActions("-/editable"),
      read: "granted/locked",
    });
  });

  it("should not list reserved section keys as roles", async () => {
    mockConfig({
      _default: [],
      _public: [],
      default: [],
      public: [],
      user_app: [],
    });

    const state = await service.getPermissions(ENTITY_TYPE, [
      "_default",
      "_public",
      "default",
      "public",
      "user_app",
    ]);

    expect(state.roles.map((role) => role.role)).toEqual(["user_app"]);
    expect(await service.getConfiguredRoleNames()).toEqual(["user_app"]);
  });

  it("should write a scalar action, an array or 'manage' depending on the selection", async () => {
    mockConfig({});

    await service.setPermissions(ENTITY_TYPE, [
      { role: "user_app", actions: actions("read") },
      { role: "assistant_app", actions: actions("read", "create") },
      {
        role: "admin_app",
        actions: actions("read", "create", "update", "delete"),
      },
    ]);

    expect(savedPermissions()).toEqual({
      user_app: [{ subject: ENTITY_TYPE, action: "read" }],
      assistant_app: [{ subject: ENTITY_TYPE, action: ["create", "read"] }],
      admin_app: [{ subject: ENTITY_TYPE, action: "manage" }],
    });
  });

  it("should preserve rules it does not own and drop a role that ends up without rules", async () => {
    mockConfig({
      user_app: [
        { subject: "Child", action: "read" },
        { subject: ENTITY_TYPE, action: ["read", "update"] },
        { subject: [ENTITY_TYPE, "Child"], action: "delete", inverted: true },
      ],
      assistant_app: [{ subject: ENTITY_TYPE, action: "read" }],
    });

    await service.setPermissions(ENTITY_TYPE, [
      { role: "user_app", actions: actions("create") },
      { role: "assistant_app", actions: actions() },
    ]);

    expect(savedPermissions()).toEqual({
      user_app: [
        { subject: "Child", action: "read" },
        { subject: [ENTITY_TYPE, "Child"], action: "delete", inverted: true },
        { subject: ENTITY_TYPE, action: "create" },
      ],
    });
  });

  it("should not write role rules for actions that are already granted by the default section", async () => {
    mockConfig({ _default: [{ subject: ENTITY_TYPE, action: "read" }] });

    await service.setPermissions(ENTITY_TYPE, [
      { role: "user_app", actions: actions("read") },
      {
        role: "assistant_app",
        actions: actions("read", "create", "update", "delete"),
      },
    ]);

    expect(savedPermissions()).toEqual({
      _default: [{ subject: ENTITY_TYPE, action: "read" }],
      assistant_app: [
        { subject: ENTITY_TYPE, action: ["create", "update", "delete"] },
      ],
    });
  });

  it("should write the shared default section like any other row", async () => {
    mockConfig({ _default: [{ subject: ENTITY_TYPE, action: "read" }] });

    await service.setPermissions(ENTITY_TYPE, [
      { role: "_default", actions: actions("read", "create") },
      { role: "user_app", actions: actions("read") },
    ]);

    expect(savedPermissions()).toEqual({
      _default: [{ subject: ENTITY_TYPE, action: ["create", "read"] }],
    });
  });

  it("should suppress role rules based on the default section as it is being saved, not as it was stored", async () => {
    mockConfig({
      _default: [{ subject: ENTITY_TYPE, action: "read" }],
      user_app: [{ subject: "Child", action: "read" }],
    });

    // the admin removes the shared "read" grant and keeps it for user_app only
    await service.setPermissions(ENTITY_TYPE, [
      { role: "_default", actions: actions() },
      { role: "user_app", actions: actions("read") },
    ]);

    expect(savedPermissions()).toEqual({
      user_app: [
        { subject: "Child", action: "read" },
        { subject: ENTITY_TYPE, action: "read" },
      ],
    });
  });

  it("should preserve rules of the default section that it does not own", async () => {
    mockConfig({
      _default: [
        { subject: "Child", action: "read" },
        { subject: ENTITY_TYPE, action: "read" },
      ],
    });

    await service.setPermissions(ENTITY_TYPE, [
      { role: "_default", actions: actions("update") },
    ]);

    expect(savedPermissions()).toEqual({
      _default: [
        { subject: "Child", action: "read" },
        { subject: ENTITY_TYPE, action: "update" },
      ],
    });
  });

  it("should never write the _public section", async () => {
    mockConfig({ _public: [{ subject: ENTITY_TYPE, action: "read" }] });

    await service.setPermissions(ENTITY_TYPE, [
      {
        role: "_public",
        actions: actions("read", "create", "update", "delete"),
      },
      { role: "user_app", actions: actions("read") },
    ]);

    expect(savedPermissions()).toEqual({
      _public: [{ subject: ENTITY_TYPE, action: "read" }],
      user_app: [{ subject: ENTITY_TYPE, action: "read" }],
    });
  });

  it("should seed an all-access default section when no permissions config exists yet", async () => {
    mockConfig(null);

    await service.setPermissions(ENTITY_TYPE, [
      { role: "user_app", actions: actions("read") },
    ]);

    expect(savedPermissions()).toEqual({
      _default: [{ subject: "all", action: "manage" }],
      user_app: [{ subject: ENTITY_TYPE, action: "read" }],
    });
  });
});
