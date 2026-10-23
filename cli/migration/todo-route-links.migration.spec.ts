import {
  buildTestContext,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { todoRouteLinks } from "./todo-route-links.migration.js";

function seedConfig(data: Record<string, unknown>) {
  return {
    "app/Config:CONFIG_ENTITY": {
      _id: "Config:CONFIG_ENTITY",
      _rev: "1-abc",
      data: {
        navigationMenu: {
          items: [
            { label: "Tasks", link: "/todo" },
            { label: "More", subMenu: [{ label: "Tasks", link: "todo" }] },
            { label: "Children", link: "/c/child" },
          ],
        },
        "view:": {
          component: "Dashboard",
          config: {
            widgets: [
              {
                component: "ShortcutDashboard",
                config: {
                  shortcuts: [
                    { label: "New task", link: "/todo/new" },
                    { label: "Tasks", link: "/c/todo" },
                    { label: "Report", link: "/report" },
                  ],
                },
              },
            ],
          },
        },
        ...data,
      },
    },
  };
}

function migratedData(store: Record<string, unknown>) {
  return (store["app/Config:CONFIG_ENTITY"] as any).data;
}

describe("todoRouteLinks migration", () => {
  it.each([
    ["no own view:todo", {}],
    [
      "an own Todo entity list",
      {
        "view:todo": {
          component: "EntityList",
          config: { entityType: "Todo" },
        },
      },
    ],
  ])("points /todo links to the entity route with %s", async (_, data) => {
    const store = seedConfig(data);

    const result = await todoRouteLinks.run(buildTestContext(store, false));

    expect(result).toEqual({ changed: true, status: "ok" });
    const { navigationMenu, "view:": dashboard } = migratedData(store);
    expect(navigationMenu.items).toEqual([
      { label: "Tasks", entityType: "Todo" },
      { label: "More", subMenu: [{ label: "Tasks", entityType: "Todo" }] },
      { label: "Children", link: "/c/child" },
    ]);
    expect(dashboard.config.widgets[0].config.shortcuts).toEqual([
      { label: "New task", link: "/c/todo/new" },
      { label: "Tasks", link: "/c/todo" },
      { label: "Report", link: "/report" },
    ]);
  });

  it("leaves the links of a config with its own non-entity view:todo unchanged", async () => {
    const result = await todoRouteLinks.run(
      buildTestContext(
        seedConfig({ "view:todo": { component: "MarkdownPage", config: {} } }),
        false,
      ),
    );

    expect(result).toEqual({ changed: false, status: "no-change" });
  });

  it("is idempotent", async () => {
    const check = await runIdempotencyCheck(todoRouteLinks, seedConfig({}));

    expect(check.secondRunResult.status).toBe("no-change");
    expect(check.stateAfterSecondRun).toEqual(check.stateAfterFirstRun);
  });
});
