import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { syncNotificationConfigTemplate } from "./sync-notification-config-template.migration.js";

function seed(
  templateRules: unknown[],
  configs: Record<string, { notificationRules?: unknown[] }>,
): DocStore {
  const store: DocStore = {
    "app/Config:NotificationConfigTemplate": {
      _id: "Config:NotificationConfigTemplate",
      _rev: "1-abc",
      data: { notificationRules: templateRules },
    },
  };
  for (const [userId, config] of Object.entries(configs)) {
    store[`app/NotificationConfig:${userId}`] = {
      _id: `NotificationConfig:${userId}`,
      _rev: "1-abc",
      channels: { email: true },
      ...config,
    };
  }
  return store;
}

const childCreatedRule = {
  label: "New child",
  notificationType: "entity_change",
  enabled: true,
  entityType: "Child",
  changeType: ["created"],
  conditions: { assignedTo: { $elemMatch: "$current_user" } },
};

function aliceRules(store: DocStore): unknown[] {
  return (store["app/NotificationConfig:alice"] as any).notificationRules;
}

describe("syncNotificationConfigTemplate migration", () => {
  it("adds a template rule missing from a user's config, with the template's enabled/channels", async () => {
    const store = seed([childCreatedRule], {
      alice: { notificationRules: [] },
    });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(aliceRules(store)).toEqual([childCreatedRule]);
  });

  it.each([
    ["label", { ...childCreatedRule, label: "Outdated title" }],
    [
      "conditions",
      // the profile id was resolved and baked in when the config was created, instead of
      // the (now backend-supported) $current_user placeholder
      {
        ...childCreatedRule,
        conditions: { assignedTo: { $elemMatch: "Child:abc123" } },
      },
    ],
  ])(
    "updates the %s of a matching rule while keeping the user's enabled/channels",
    async (_field, existingRule) => {
      const store = seed([childCreatedRule], {
        alice: { notificationRules: [{ ...existingRule, enabled: false }] },
      });

      const result = await syncNotificationConfigTemplate.run(
        buildTestContext(store, false),
      );

      expect(result).toEqual({ changed: true, status: "ok" });
      expect(aliceRules(store)).toEqual([
        { ...childCreatedRule, enabled: false },
      ]);
    },
  );

  it("overwrites enabled/channels too when run with the full argument, dropping fields the template no longer has", async () => {
    const store = seed([childCreatedRule], {
      alice: {
        notificationRules: [
          {
            ...childCreatedRule,
            conditions: { assignedTo: { $elemMatch: "Child:abc123" } },
            enabled: false,
            channels: { email: false },
          },
        ],
      },
    });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false, ["full"]),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(aliceRules(store)).toEqual([childCreatedRule]);
  });

  it("leaves a rule the user added themselves untouched", async () => {
    const customRule = {
      label: "My custom rule",
      notificationType: "entity_change",
      enabled: true,
      entityType: "School",
      changeType: ["updated"],
      conditions: {},
    };
    const store = seed([childCreatedRule], {
      alice: { notificationRules: [customRule] },
    });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(aliceRules(store)).toEqual([customRule, childCreatedRule]);
  });

  it("warns and leaves rules untouched when several existing rules match the same template key ambiguously", async () => {
    const firstCustom = {
      ...childCreatedRule,
      label: "Notify about my own new children",
      conditions: { assignedTo: { $elemMatch: "Child:abc123" } },
    };
    const secondCustom = {
      ...childCreatedRule,
      label: "Notify about new children in my school",
      conditions: { school: { $elemMatch: "School:xyz" } },
    };
    const store = seed([childCreatedRule], {
      alice: { notificationRules: [firstCustom, secondCustom] },
    });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result.changed).toBe(false);
    expect(result.warnings).toEqual([expect.stringContaining("alice")]);
    expect(aliceRules(store)).toEqual([firstCustom, secondCustom]);
  });

  it("disambiguates several same-key rules by an exact conditions match", async () => {
    const unrelatedRule = {
      ...childCreatedRule,
      label: "Unrelated",
      conditions: { school: { $elemMatch: "School:xyz" } },
    };
    const matchingRule = {
      ...childCreatedRule,
      label: "Outdated title",
    };
    const store = seed([childCreatedRule], {
      alice: { notificationRules: [unrelatedRule, matchingRule] },
    });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(aliceRules(store)).toEqual([unrelatedRule, childCreatedRule]);
  });

  it("does not change a config already matching the template", async () => {
    const store = seed([childCreatedRule], {
      alice: { notificationRules: [childCreatedRule] },
    });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: false, status: "no-change" });
  });

  it("does nothing when no template is configured", async () => {
    const result = await syncNotificationConfigTemplate.run(
      buildTestContext({}, false),
    );

    expect(result).toEqual({ changed: false, status: "no-change" });
  });

  it("does nothing when the template has no notificationRules", async () => {
    const store: DocStore = {
      "app/Config:NotificationConfigTemplate": {
        _id: "Config:NotificationConfigTemplate",
        _rev: "1-abc",
        data: {},
      },
    };

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: false, status: "no-change" });
  });

  it("refuses to run when the template itself has two rules with the same key", async () => {
    const store = seed(
      [childCreatedRule, { ...childCreatedRule, label: "Duplicate" }],
      {
        alice: { notificationRules: [] },
      },
    );

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result.status).toBe("failed");
    expect(aliceRules(store)).toEqual([]);
  });

  it("rejects an unknown argument", async () => {
    const store = seed([childCreatedRule], {});

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false, ["bogus"]),
    );

    expect(result.status).toBe("failed");
  });

  describe("replace argument", () => {
    it("replaces a user's rules wholesale with the template's, discarding anything else", async () => {
      const customRule = { ...childCreatedRule, label: "My custom rule" };
      const store = seed([childCreatedRule], {
        alice: { notificationRules: [customRule] },
      });

      const result = await syncNotificationConfigTemplate.run(
        buildTestContext(store, false, ["replace"]),
      );

      expect(result).toEqual({ changed: true, status: "ok" });
      expect(aliceRules(store)).toEqual([childCreatedRule]);
    });

    it("tolerates a template with duplicate keys, since matching does not apply", async () => {
      const store = seed(
        [childCreatedRule, { ...childCreatedRule, label: "Duplicate" }],
        { alice: { notificationRules: [] } },
      );

      const result = await syncNotificationConfigTemplate.run(
        buildTestContext(store, false, ["replace"]),
      );

      expect(result).toEqual({ changed: true, status: "ok" });
      expect(aliceRules(store)).toHaveLength(2);
    });
  });

  it.each([[[]], [["full"]], [["replace"]]])(
    "is idempotent (args=%j)",
    async (args: string[]) => {
      const store = seed([childCreatedRule], {
        alice: {
          notificationRules: [{ ...childCreatedRule, label: "Outdated" }],
        },
        bob: { notificationRules: [] },
      });

      const check = await runIdempotencyCheck(
        syncNotificationConfigTemplate,
        store,
        args,
      );

      expect(check.secondRunResult.status).toBe("no-change");
      expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
    },
  );
});
