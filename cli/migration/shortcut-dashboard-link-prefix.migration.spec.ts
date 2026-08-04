import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { shortcutDashboardLinkPrefix } from "./shortcut-dashboard-link-prefix.migration.js";

function seedConfig(shortcuts: unknown[]): DocStore {
  return {
    "app/Config:CONFIG_ENTITY": {
      _id: "Config:CONFIG_ENTITY",
      _rev: "1-abc",
      data: {
        "view:item": {
          component: "EntityList",
          config: { entityType: "Item" },
        },
        "view:dashboard": {
          component: "Dashboard",
          config: {
            widgets: [
              {
                component: "ShortcutDashboard",
                config: { shortcuts },
              },
            ],
          },
        },
      },
    },
  };
}

describe("shortcutDashboardLinkPrefix migration", () => {
  it("prefixes a shortcut link that matches a known entity route with /c/", async () => {
    const store = seedConfig([
      { label: "Add Item", icon: "plus", link: "/item/new" },
    ]);
    const ctx = buildTestContext(store, false);

    const result = await shortcutDashboardLinkPrefix.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.status).toBe("ok");
    const widgets = (store["app/Config:CONFIG_ENTITY"] as any).data[
      "view:dashboard"
    ].config.widgets;
    expect(widgets[0].config.shortcuts[0].link).toBe("/c/item/new");
  });

  it("leaves a link unchanged that doesn't match any known entity route", async () => {
    const store = seedConfig([
      { label: "Unrelated", link: "/some/other/path" },
    ]);
    const ctx = buildTestContext(store, false);

    const result = await shortcutDashboardLinkPrefix.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
    const widgets = (store["app/Config:CONFIG_ENTITY"] as any).data[
      "view:dashboard"
    ].config.widgets;
    expect(widgets[0].config.shortcuts[0].link).toBe("/some/other/path");
  });

  it("leaves an already-migrated link unchanged", async () => {
    const store = seedConfig([{ label: "Add Item", link: "/c/item/new" }]);
    const ctx = buildTestContext(store, false);

    const result = await shortcutDashboardLinkPrefix.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seedConfig([{ label: "Add Item", link: "/item/new" }]);
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, true);

    const result = await shortcutDashboardLinkPrefix.run(ctx);

    expect(result.status).toBe("dry-run");
    expect(result.changed).toBe(true);
    expect(JSON.stringify(store)).toBe(before);
  });

  it("fails when there is no config document", async () => {
    const ctx = buildTestContext({}, false);

    const result = await shortcutDashboardLinkPrefix.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.warnings).toEqual(["Config document not found"]);
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(
      shortcutDashboardLinkPrefix,
      seedConfig([{ label: "Add Item", link: "/item/new" }]),
    );

    expect(check.firstRunResult.changed).toBe(true);
    expect(check.secondRunResult.changed).toBe(false);
    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
