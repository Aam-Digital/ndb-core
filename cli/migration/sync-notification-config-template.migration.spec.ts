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
  conditions: {},
};

describe("syncNotificationConfigTemplate migration", () => {
  it("adds a template rule missing from a user's config, with the template's enabled/channels", async () => {
    const store = seed([childCreatedRule], { alice: { notificationRules: [] } });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(
      (store["app/NotificationConfig:alice"] as any).notificationRules,
    ).toEqual([childCreatedRule]);
  });

  it.each([
    [
      "label",
      { ...childCreatedRule, label: "Outdated title" },
      { ...childCreatedRule, label: "New child" },
    ],
    [
      "conditions",
      { ...childCreatedRule, conditions: { assignedTo: "$current_user" } },
      childCreatedRule,
    ],
  ])(
    "updates the %s of a matching rule while keeping the user's enabled/channels",
    async (_field, existingRule, expectedRule) => {
      const store = seed([childCreatedRule], {
        alice: {
          notificationRules: [{ ...existingRule, enabled: false }],
        },
      });

      const result = await syncNotificationConfigTemplate.run(
        buildTestContext(store, false),
      );

      expect(result).toEqual({ changed: true, status: "ok" });
      expect(
        (store["app/NotificationConfig:alice"] as any).notificationRules,
      ).toEqual([{ ...expectedRule, enabled: false }]);
    },
  );

  it("overwrites enabled/channels too when run with the full argument", async () => {
    const store = seed([childCreatedRule], {
      alice: {
        notificationRules: [
          { ...childCreatedRule, enabled: false, channels: { email: false } },
        ],
      },
    });

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false, ["full"]),
    );

    expect(result).toEqual({ changed: true, status: "ok" });
    expect(
      (store["app/NotificationConfig:alice"] as any).notificationRules,
    ).toEqual([childCreatedRule]);
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
    expect(
      (store["app/NotificationConfig:alice"] as any).notificationRules,
    ).toEqual([customRule, childCreatedRule]);
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

  it("rejects an unknown argument", async () => {
    const store = seed([childCreatedRule], {});

    const result = await syncNotificationConfigTemplate.run(
      buildTestContext(store, false, ["bogus"]),
    );

    expect(result.status).toBe("failed");
  });

  it.each([[[]], [["full"]]])(
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
