import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { codoAddEventType } from "./codo-add-event-type.migration.js";

function baseSeed(): DocStore {
  return {
    "app/Config:CONFIG_ENTITY": {
      _id: "Config:CONFIG_ENTITY",
      data: {
        navigationMenu: {
          items: [
            { entityType: "Child" },
            { entityType: "ChildSchoolRelation" },
            { entityType: "Note" },
            { entityType: "Todo" },
          ],
        },
        "entity:Note": {
          label: "Notiz",
          attributes: {
            relatedEntities: {
              dataType: "entity",
              additional: "ChildSchoolRelation",
              label: "Patenschaft/en",
              isArray: true,
            },
          },
        },
        "entity:Todo": {
          label: "Aufgabe",
          attributes: {
            relatedEntities: {
              dataType: "entity",
              additional: ["Child", "School", "ChildSchoolRelation"],
              isArray: true,
            },
          },
        },
        "view:mentor/:id": {
          config: {
            panels: [
              { title: "Mentor:in", components: [{ component: "Form" }] },
              {
                title: "Notizen & Aufgaben",
                components: [
                  { component: "NotesRelatedToEntity" },
                  { component: "TodosRelatedToEntity" },
                ],
              },
            ],
          },
        },
        "view:mentee/:id": {
          config: {
            panels: [
              { title: "Mentee", components: [{ component: "Form" }] },
              {
                title: "Notizen & Aufgaben",
                components: [
                  { component: "NotesRelatedToEntity" },
                  { component: "TodosRelatedToEntity" },
                ],
              },
            ],
          },
        },
        "view:matching": { component: "MatchingEntities" },
      },
    },
  };
}

describe("codoAddEventType migration", () => {
  it("should apply all changes on first run", async () => {
    const store = baseSeed();
    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.status).toBe("ok");

    expect(store["app/ConfigurableEnum:artDerVeranstaltung"]).toBeDefined();
    expect(store["app/ConfigurableEnum:attendance-status"]).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = store["app/Config:CONFIG_ENTITY"] as any;

    expect(config.data["entity:event"]).toBeDefined();
    expect(config.data["entity:event"].label).toBe("Veranstaltung");
    expect(config.data["view:event"]).toBeDefined();
    expect(config.data["view:event/:id"]).toBeDefined();

    expect(
      config.data["entity:Note"].attributes.relatedEntities.additional,
    ).toEqual(["ChildSchoolRelation", "event"]);
    expect(config.data["entity:Note"].attributes.relatedEntities.label).toBe(
      "Sonstige verknüpfte Datensätze",
    );
    expect(
      config.data["entity:Todo"].attributes.relatedEntities.additional,
    ).toEqual(["Child", "School", "ChildSchoolRelation", "event"]);

    const items = config.data.navigationMenu.items;
    const eventIdx = items.findIndex(
      (i: { entityType: string }) => i.entityType === "event",
    );
    const noteIdx = items.findIndex(
      (i: { entityType: string }) => i.entityType === "Note",
    );
    expect(eventIdx).toBeGreaterThanOrEqual(0);
    expect(noteIdx).toBeGreaterThan(eventIdx);

    const mentorPanels = config.data["view:mentor/:id"].config.panels;
    const mentorTab = mentorPanels.find(
      (p: { title: string }) => p.title === "Notizen & Aufgaben",
    );
    expect(mentorTab.components).toContainEqual(
      expect.objectContaining({
        component: "RelatedEntities",
        config: expect.objectContaining({ entityType: "event" }),
      }),
    );

    const menteePanels = config.data["view:mentee/:id"].config.panels;
    const menteeTab = menteePanels.find(
      (p: { title: string }) => p.title === "Notizen & Aufgaben",
    );
    expect(menteeTab.components).toContainEqual(
      expect.objectContaining({
        component: "RelatedEntities",
        config: expect.objectContaining({ entityType: "event" }),
      }),
    );
  });

  it("should be idempotent (second run reports no-change)", async () => {
    const result = await runIdempotencyCheck(codoAddEventType, baseSeed());

    expect(result.secondRunResult.changed).toBe(false);
    expect(result.secondRunResult.status).toBe("no-change");
    expect(result.stateAfterSecondRun).toEqual(result.stateAfterFirstRun);
  });

  it("should handle missing config document", async () => {
    const ctx = buildTestContext({});
    const result = await codoAddEventType.run(ctx);

    expect(result.status).toBe("failed");
    expect(result.changed).toBe(false);
  });

  it("should handle missing data object in config", async () => {
    const store: DocStore = {
      "app/Config:CONFIG_ENTITY": { _id: "Config:CONFIG_ENTITY" },
    };
    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.status).toBe("failed");
    expect(result.warnings).toContainEqual(
      expect.stringContaining("no data object"),
    );
  });

  it("should skip existing enum docs without overwriting", async () => {
    const store = baseSeed();
    store["app/ConfigurableEnum:artDerVeranstaltung"] = {
      _id: "ConfigurableEnum:artDerVeranstaltung",
      values: [{ id: "CUSTOM", label: "Custom" }],
    };
    store["app/ConfigurableEnum:attendance-status"] = {
      _id: "ConfigurableEnum:attendance-status",
      values: [{ id: "X", label: "X" }],
    };

    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artEnum = store["app/ConfigurableEnum:artDerVeranstaltung"] as any;
    expect(artEnum.values[0].id).toBe("CUSTOM");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attEnum = store["app/ConfigurableEnum:attendance-status"] as any;
    expect(attEnum.values[0].id).toBe("X");
  });

  it("should skip existing entity:event without overwriting", async () => {
    const store = baseSeed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store["app/Config:CONFIG_ENTITY"] as any).data["entity:event"] = {
      label: "Custom Event",
    };

    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = store["app/Config:CONFIG_ENTITY"] as any;
    expect(config.data["entity:event"].label).toBe("Custom Event");
  });

  it("should handle missing mentor/mentee views with warnings", async () => {
    const store = baseSeed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (store["app/Config:CONFIG_ENTITY"] as any).data;
    delete data["view:mentor/:id"];
    delete data["view:mentee/:id"];

    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.stringContaining("view:mentor/:id"),
    );
    expect(result.warnings).toContainEqual(
      expect.stringContaining("view:mentee/:id"),
    );
  });

  it("should handle missing relatedEntities attribute with warning", async () => {
    const store = baseSeed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (store["app/Config:CONFIG_ENTITY"] as any).data;
    delete data["entity:Note"].attributes.relatedEntities;

    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.stringContaining("entity:Note"),
    );
  });

  it("should handle detail view without matching tab", async () => {
    const store = baseSeed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (store["app/Config:CONFIG_ENTITY"] as any).data;
    data["view:mentor/:id"].config.panels = [
      { title: "Sonstiges", components: [{ component: "Form" }] },
    ];

    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.stringContaining("view:mentor/:id"),
    );
    expect(result.warnings).toContainEqual(
      expect.stringContaining("manual review"),
    );
  });

  it("should find tab by content-based fallback", async () => {
    const store = baseSeed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (store["app/Config:CONFIG_ENTITY"] as any).data;
    data["view:mentor/:id"].config.panels[1].title = "Alles Mögliche";

    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    const panel = data["view:mentor/:id"].config.panels[1];
    expect(panel.components).toContainEqual(
      expect.objectContaining({
        component: "RelatedEntities",
        config: expect.objectContaining({ entityType: "event" }),
      }),
    );
  });

  it("should append event to end of nav menu when Note is absent", async () => {
    const store = baseSeed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (store["app/Config:CONFIG_ENTITY"] as any).data;
    data.navigationMenu.items = [
      { entityType: "Child" },
      { entityType: "Todo" },
    ];

    const ctx = buildTestContext(store);
    const result = await codoAddEventType.run(ctx);

    expect(result.changed).toBe(true);
    const items = data.navigationMenu.items;
    expect(items[items.length - 1]).toEqual({ entityType: "event" });
  });
});
