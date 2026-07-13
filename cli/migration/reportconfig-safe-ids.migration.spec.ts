import {
  buildTestContext,
  type DocStore,
} from "./testing/migration-idempotency.harness.js";
import { reportConfigSafeIds } from "./reportconfig-safe-ids.migration.js";

function seedWithUmlautReport(): DocStore {
  return {
    "app/ReportConfig:Gesamt-Übersicht": {
      _id: "ReportConfig:Gesamt-Übersicht",
      _rev: "1-abc",
      title: "Gesamt-Übersicht",
    },
  };
}

describe("reportConfigSafeIds migration", () => {
  it("renames an umlaut id to the base vowel and deletes the original", async () => {
    const store = seedWithUmlautReport();
    const ctx = buildTestContext(store, false);

    const result = await reportConfigSafeIds.run(ctx);

    expect(result.changed).toBe(true);
    expect(result.status).toBe("ok");

    // copy created under the ASCII id, without the old _rev
    const copy = store["app/ReportConfig:Gesamt-Ubersicht"] as Record<
      string,
      unknown
    >;
    expect(copy).toBeDefined();
    expect(copy._id).toBe("ReportConfig:Gesamt-Ubersicht");
    expect(copy._rev).toBeUndefined();
    expect(copy.title).toBe("Gesamt-Übersicht"); // only the id is transliterated, not the data

    // original deleted via body-based _bulk_docs (never in a URL path)
    expect(ctx.couchdb.putAll).toHaveBeenCalledWith([
      { _id: "ReportConfig:Gesamt-Übersicht", _rev: "1-abc", _deleted: true },
    ]);
  });

  it("replaces spaces and & with a hyphen", async () => {
    const store: DocStore = {
      "app/ReportConfig:Report:Eventi & attivi": {
        _id: "ReportConfig:Report:Eventi & attivi",
        _rev: "1-abc",
        title: "Eventi & attivi",
      },
    };
    const ctx = buildTestContext(store, false);

    const result = await reportConfigSafeIds.run(ctx);

    expect(result.status).toBe("ok");
    const copy = store["app/ReportConfig:Report:Eventi-attivi"] as Record<
      string,
      unknown
    >;
    expect(copy).toBeDefined();
    expect(copy._id).toBe("ReportConfig:Report:Eventi-attivi");
    expect(ctx.couchdb.putAll).toHaveBeenCalledWith([
      {
        _id: "ReportConfig:Report:Eventi & attivi",
        _rev: "1-abc",
        _deleted: true,
      },
    ]);
  });

  it("writes nothing in dry-run mode", async () => {
    const store = seedWithUmlautReport();
    const before = JSON.stringify(store);
    const ctx = buildTestContext(store, true);

    const result = await reportConfigSafeIds.run(ctx);

    expect(result.status).toBe("dry-run");
    expect(result.changed).toBe(true);
    expect(JSON.stringify(store)).toBe(before);
    expect(ctx.couchdb.putAll).not.toHaveBeenCalled();
  });

  it("is a no-op once ids are ASCII (idempotent on real infra)", async () => {
    const store: DocStore = {
      "app/ReportConfig:Gesamt-Ubersicht": {
        _id: "ReportConfig:Gesamt-Ubersicht",
        _rev: "1-abc",
        title: "Gesamt-Übersicht",
      },
    };
    const ctx = buildTestContext(store, false);

    const result = await reportConfigSafeIds.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
    expect(ctx.couchdb.putAll).not.toHaveBeenCalled();
  });

  it("skips (does not clobber) when the target id already exists", async () => {
    const store: DocStore = {
      "app/ReportConfig:Gesamt-Übersicht": {
        _id: "ReportConfig:Gesamt-Übersicht",
        _rev: "1-abc",
      },
      "app/ReportConfig:Gesamt-Ubersicht": {
        _id: "ReportConfig:Gesamt-Ubersicht",
        _rev: "1-def",
      },
    };
    const ctx = buildTestContext(store, false);

    const result = await reportConfigSafeIds.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.status).toBe("no-change");
    expect(result.warnings?.[0]).toContain("already exists");
    expect(ctx.couchdb.putAll).not.toHaveBeenCalled();
  });

  it("skips docs with attachments", async () => {
    const store: DocStore = {
      "app/ReportConfig:Übersicht": {
        _id: "ReportConfig:Übersicht",
        _rev: "1-abc",
        _attachments: { "logo.png": { content_type: "image/png" } },
      },
    };
    const ctx = buildTestContext(store, false);

    const result = await reportConfigSafeIds.run(ctx);

    expect(result.changed).toBe(false);
    expect(result.warnings?.[0]).toContain("attachments");
    expect(ctx.couchdb.putAll).not.toHaveBeenCalled();
  });
});
