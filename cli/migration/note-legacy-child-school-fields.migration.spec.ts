import { vi } from "vitest";
import {
  buildTestContext,
  type DocStore,
  runIdempotencyCheck,
} from "./testing/migration-idempotency.harness.js";
import { noteLegacyChildSchoolFields } from "./note-legacy-child-school-fields.migration.js";

const CONFIG_PATH = "app/Config:CONFIG_ENTITY";

const CHILD_FIELD = {
  label: "Participants",
  dataType: "entity",
  isArray: true,
  additional: "Child",
  entityReferenceRole: "composite",
  editComponent: "EditLegacyAttendance",
  anonymize: "retain",
};
const SCHOOL_FIELD = {
  label: "Groups",
  dataType: "entity",
  isArray: true,
  additional: "School",
  entityReferenceRole: "composite",
  anonymize: "retain",
};

/** the legacy attendance field, as the migration writes it into the config */
const ATTENDANCE_FIELD = {
  dataType: "event-attendance-map",
  additional: {
    participant: { dataType: "entity", additional: ["Child"] },
  },
  anonymize: "retain",
};

const childAndSchoolTypes = {
  "entity:Child": { attributes: { name: { dataType: "string" } } },
  "entity:School": { attributes: { name: { dataType: "string" } } },
};

/** a NoteDetails view with an explicit bottomForm, so the previous default does not apply */
const explicitNoteDetails = {
  "view:note/:id": {
    component: "NoteDetails",
    config: { entityType: "Note", bottomForm: ["attachment"] },
  },
};

/** `relatedEntities` as configured in the base configs of new systems */
const RELATED_ENTITIES_FIELD = {
  label: "Related Records",
  dataType: "entity",
  additional: ["Child", "School"],
  isArray: true,
  entityReferenceRole: "composite",
  anonymize: "retain",
};

function seed(data: Record<string, unknown>, docs: DocStore = {}): DocStore {
  // the stub db hands out stored objects by reference, so keep the shared fixtures untouched
  return structuredClone({
    [CONFIG_PATH]: { _id: "Config:CONFIG_ENTITY", data },
    ...docs,
  });
}

function configData(store: DocStore): any {
  return (store[CONFIG_PATH] as any).data;
}

describe("noteLegacyChildSchoolFields migration", () => {
  it("does not add anything for a system without Child or School types", async () => {
    const store = seed({}, { "app/Note:1": { _id: "Note:1", subject: "x" } });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(configData(store)).toEqual({});
  });

  it("does not add anything for a new system using relatedEntities only", async () => {
    const store = seed(
      {
        ...childAndSchoolTypes,
        "entity:Note": {
          attributes: { relatedEntities: RELATED_ENTITIES_FIELD },
        },
        "view:note": {
          component: "EntityList",
          config: { entityType: "Note", columns: ["date", "relatedEntities"] },
        },
        "view:note/:id": {
          component: "NoteDetails",
          config: { entityType: "Note", bottomForm: ["relatedEntities"] },
        },
      },
      {
        "app/Note:1": {
          _id: "Note:1",
          relatedEntities: ["Child:1"],
          children: [],
        },
      },
    );

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(result.warnings).toBeUndefined();
  });

  it("restores fields holding data and their previous bottomForm if view:note/:id does not exist", async () => {
    const store = seed(childAndSchoolTypes, {
      "app/Note:1": { _id: "Note:1", children: ["Child:1"] },
    });
    const confirm = vi.fn(async () => false);

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store, false, [], confirm),
    );

    expect(confirm).not.toHaveBeenCalled();
    expect(result.status).toBe("ok");
    const data = configData(store);
    // `schools` was shown by the default bottomForm as well, but never filled
    expect(data["entity:Note"].attributes).toEqual({ children: CHILD_FIELD });
    expect(data["view:note/:id"]).toEqual({
      component: "NoteDetails",
      config: {
        entityType: "Note",
        topForm: ["date", "warningLevel", "category", "authors", "attachment"],
        middleForm: ["subject", "text"],
        bottomForm: ["children"],
      },
    });
  });

  it("sets the previous bottomForm only for fields in config that hold data", async () => {
    const customChildField = { ...CHILD_FIELD, label: "Children" };
    const store = seed(
      {
        ...childAndSchoolTypes,
        "entity:Note": {
          attributes: { children: customChildField, schools: SCHOOL_FIELD },
        },
        "view:note/:id": {
          component: "NoteDetails",
          config: { topForm: ["date"] },
        },
      },
      { "app/Note:1": { _id: "Note:1", children: ["Child:1"], schools: [] } },
    );

    await noteLegacyChildSchoolFields.run(buildTestContext(store));

    const data = configData(store);
    expect(data["entity:Note"].attributes).toEqual({
      children: customChildField,
    });
    expect(data["view:note/:id"].config).toEqual({
      topForm: ["date"],
      bottomForm: ["children"],
    });
  });

  it("removes fields from config that were only shown by the default bottomForm but never filled", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      "entity:Note": {
        attributes: { children: CHILD_FIELD, schools: SCHOOL_FIELD },
      },
      "view:note/:id": {
        component: "NoteDetails",
        config: { topForm: ["date"] },
      },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("ok");
    expect(result.warnings).toBeUndefined();
    const data = configData(store);
    expect(data["view:note/:id"].config.bottomForm).toBeUndefined();
    // the new default bottomForm [relatedEntities] is configured to link the existing types instead
    expect(data["entity:Note"].attributes).toEqual({
      relatedEntities: {
        label: "Related Records",
        dataType: "entity",
        additional: ["Child", "School"],
        isArray: true,
        entityReferenceRole: "composite",
        anonymize: "retain",
      },
    });
  });

  it("configures relatedEntities to link only the existing types, in the default language", async () => {
    const store = seed(
      { "entity:Child": { attributes: {} } },
      {
        "app/SiteSettings:global": {
          _id: "SiteSettings:global",
          defaultLanguage: "de",
        },
      },
    );

    await noteLegacyChildSchoolFields.run(buildTestContext(store));

    expect(configData(store)["entity:Note"].attributes.relatedEntities).toEqual(
      expect.objectContaining({
        label: "Verknüpfte Datensätze",
        additional: ["Child"],
      }),
    );
  });

  it("leaves an already configured relatedEntities field untouched", async () => {
    const relatedEntities = { dataType: "entity", isArray: true };
    const store = seed({
      ...childAndSchoolTypes,
      "entity:Note": { attributes: { relatedEntities } },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(configData(store)["entity:Note"].attributes).toEqual({
      relatedEntities,
    });
    // the new default bottomForm cannot link anything here
    expect(result.warnings).toEqual([
      expect.stringContaining(
        "shows relatedEntities, but it has no entity types to link",
      ),
    ]);
  });

  it("does not restore fields only shown by the default bottomForm of a missing view if never filled", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      "entity:Note": {
        attributes: {
          relatedEntities: { dataType: "entity", additional: ["Child"] },
        },
      },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(result.warnings).toBeUndefined();
  });

  it("restores a field that is only used in data after confirmation", async () => {
    const store = seed(
      { ...childAndSchoolTypes, ...explicitNoteDetails },
      {
        "app/Note:1": { _id: "Note:1", schools: ["School:1"] },
        "app/Note:2": { _id: "Note:2", schools: ["School:2"] },
        "app/Child:1": { _id: "Child:1", children: ["not a note"] },
      },
    );
    const confirm = vi.fn(async () => true);

    await noteLegacyChildSchoolFields.run(
      buildTestContext(store, false, [], confirm),
    );

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("2 Note docs have data"),
    );
    const data = configData(store);
    expect(data["entity:Note"].attributes).toEqual({ schools: SCHOOL_FIELD });
    expect(data["view:note/:id"].config.bottomForm).toEqual(["attachment"]);
  });

  it("does not restore a field that is only used in data if declined", async () => {
    const store = seed(
      { ...childAndSchoolTypes, ...explicitNoteDetails },
      { "app/Note:1": { _id: "Note:1", schools: ["School:1"] } },
    );

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store, false, [], async () => false),
    );

    expect(result.warnings).toEqual([
      expect.stringContaining("Note.schools not restored (declined)"),
    ]);
    // without any legacy field left, notes are linked through relatedEntities instead
    expect(configData(store)["entity:Note"].attributes).toEqual({
      relatedEntities: RELATED_ENTITIES_FIELD,
    });
  });

  it("removes references of a field without data instead of restoring it", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      ...explicitNoteDetails,
      "view:child/:id": {
        component: "EntityDetails",
        config: {
          entityType: "Child",
          panels: [
            {
              components: [
                {
                  component: "NotesRelatedToEntity",
                  config: { columns: ["date", "children"] },
                },
                {
                  // a field of the same name on another entity type is no reference
                  component: "RelatedEntities",
                  config: { entityType: "School", columns: ["schools"] },
                },
              ],
            },
          ],
        },
      },
    });
    const confirm = vi.fn(async () => false);

    await noteLegacyChildSchoolFields.run(
      buildTestContext(store, false, [], confirm),
    );

    expect(confirm).not.toHaveBeenCalled();
    const data = configData(store);
    expect(data["entity:Note"].attributes.children).toBeUndefined();
    const [notes, schools] = data["view:child/:id"].config.panels[0].components;
    expect(notes.config.columns).toEqual(["date"]);
    expect(schools.config.columns).toEqual(["schools"]);
  });

  it("restores a field holding data that is referenced in Note related config", async () => {
    const store = seed(
      {
        ...childAndSchoolTypes,
        ...explicitNoteDetails,
        "view:note": {
          component: "EntityList",
          config: { entityType: "Note", columns: ["date", "children"] },
        },
      },
      { "app/Note:1": { _id: "Note:1", children: ["Child:1"] } },
    );
    const confirm = vi.fn(async () => false);

    await noteLegacyChildSchoolFields.run(
      buildTestContext(store, false, [], confirm),
    );

    expect(confirm).not.toHaveBeenCalled();
    const data = configData(store);
    expect(data["entity:Note"].attributes).toEqual({ children: CHILD_FIELD });
    expect(data["view:note"].config.columns).toEqual(["date", "children"]);
  });

  it("removes an unused field from all lists of Note related config", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      "entity:Note": {
        toStringAttributes: ["subject", "children"],
        attributes: { children: CHILD_FIELD },
      },
      "view:note": {
        component: "EntityList",
        config: {
          entityType: "Note",
          columnGroups: {
            groups: [{ name: "Overview", columns: ["date", "children"] }],
          },
          filters: [{ id: "date" }, { id: "children" }],
        },
      },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("ok");
    const data = configData(store);
    expect(data["entity:Note"]).toEqual({
      toStringAttributes: ["subject"],
      attributes: { relatedEntities: RELATED_ENTITIES_FIELD },
    });
    expect(data["view:note"].config.columnGroups.groups[0].columns).toEqual([
      "date",
    ]);
    expect(data["view:note"].config.filters).toEqual([{ id: "date" }]);
  });

  it("keeps an unused field and its references if a reference cannot be removed", async () => {
    const config = {
      ...childAndSchoolTypes,
      ...explicitNoteDetails,
      "entity:Note": { attributes: { children: CHILD_FIELD } },
      "view:note": {
        component: "EntityList",
        config: {
          entityType: "Note",
          columns: ["date", "children"],
          groupBy: "children",
        },
      },
    };
    const store = seed(config);

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(configData(store)).toEqual(config);
    expect(result.warnings).toEqual([
      expect.stringContaining(
        "entity:Note.children holds no data but is kept: the references in view:note cannot be removed",
      ),
    ]);
  });

  it("keeps an unused field mentioned in a SQL report", async () => {
    const store = seed(
      {
        ...childAndSchoolTypes,
        ...explicitNoteDetails,
        "entity:Note": { attributes: { schools: SCHOOL_FIELD } },
      },
      {
        "app/ReportConfig:sql": {
          _id: "ReportConfig:sql",
          mode: "sql",
          reportDefinition: [{ query: "SELECT schools FROM Note" }],
        },
      },
    );

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(configData(store)["entity:Note"].attributes).toEqual({
      schools: SCHOOL_FIELD,
    });
    expect(result.warnings).toEqual([
      expect.stringContaining("mentioned in SQL ReportConfig:sql"),
    ]);
  });

  it("leaves a custom field that shares the name of a legacy field untouched", async () => {
    const customField = { dataType: "number", label: "Number of children" };
    const store = seed({
      ...childAndSchoolTypes,
      ...explicitNoteDetails,
      "entity:Note": { attributes: { children: customField } },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(configData(store)["entity:Note"].attributes).toEqual({
      children: customField,
      relatedEntities: RELATED_ENTITIES_FIELD,
    });
  });

  it("restores a field without data that a PublicFormConfig for Notes uses", async () => {
    const store = seed(
      { ...childAndSchoolTypes, ...explicitNoteDetails },
      {
        "app/PublicFormConfig:note-form": {
          _id: "PublicFormConfig:note-form",
          entity: "Note",
          columns: [{ fields: ["subject"] }],
          prefilled: { children: { mode: "static", config: { value: "x" } } },
        },
      },
    );

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(configData(store)["entity:Note"].attributes).toEqual({
      children: CHILD_FIELD,
    });
    expect(result.warnings).toEqual([
      expect.stringContaining("used in PublicFormConfig:note-form"),
    ]);
  });

  it("warns instead of restoring a used field if its entity type does not exist", async () => {
    const store = seed(
      { "entity:Child": {}, ...explicitNoteDetails },
      { "app/Note:1": { _id: "Note:1", schools: ["School:1"] } },
    );

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.warnings).toEqual([
      expect.stringContaining("entity:School does not exist"),
    ]);
    expect(configData(store)["entity:Note"].attributes).toEqual({
      relatedEntities: { ...RELATED_ENTITIES_FIELD, additional: ["Child"] },
    });
  });

  it("keeps an unused legacy field and its references if the configured note details form shows it", async () => {
    const config = {
      ...childAndSchoolTypes,
      "entity:Note": {
        attributes: {
          children: CHILD_FIELD,
          relatedEntities: RELATED_ENTITIES_FIELD,
        },
      },
      "view:note": {
        component: "EntityList",
        config: { entityType: "Note", columns: ["date", "children"] },
      },
      "view:note/:id": {
        component: "NoteDetails",
        config: {
          entityType: "Note",
          bottomForm: ["children", "relatedEntities"],
        },
      },
    };
    const store = seed(config);

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(configData(store)).toEqual(config);
    expect(result.verdicts).toEqual([
      {
        kind: "none",
        text: "keep unused legacy children field (shown in configured note details form)",
      },
    ]);
    expect(result.warnings).toBeUndefined();
  });

  it("restores a legacy field without data if the configured note details form shows it", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      "entity:Note": {
        attributes: { relatedEntities: RELATED_ENTITIES_FIELD },
      },
      "view:note/:id": {
        component: "NoteDetails",
        config: { entityType: "Note", bottomForm: ["children"] },
      },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(configData(store)["entity:Note"].attributes).toEqual({
      children: CHILD_FIELD,
      relatedEntities: RELATED_ENTITIES_FIELD,
    });
    expect(configData(store)["view:note/:id"].config.bottomForm).toEqual([
      "children",
    ]);
    expect(result.warnings).toBeUndefined();
  });

  it("configures relatedEntities if a configured note details form shows it and the legacy fields are removed", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      "entity:Note": { attributes: { children: CHILD_FIELD } },
      "view:note": {
        component: "EntityList",
        config: { entityType: "Note", columns: ["date", "children"] },
      },
      "view:note/:id": {
        component: "NoteDetails",
        config: { entityType: "Note", bottomForm: ["relatedEntities"] },
      },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    const data = configData(store);
    expect(data["view:note"].config.columns).toEqual(["date"]);
    expect(data["view:note/:id"].config.bottomForm).toEqual([
      "relatedEntities",
    ]);
    expect(data["entity:Note"].attributes).toEqual({
      relatedEntities: RELATED_ENTITIES_FIELD,
    });
    expect(result.warnings).toBeUndefined();
  });

  it("does not configure relatedEntities while a legacy field is kept", async () => {
    const store = seed(
      {
        ...childAndSchoolTypes,
        "entity:Note": { attributes: { children: CHILD_FIELD } },
        "view:note/:id": {
          component: "NoteDetails",
          config: { entityType: "Note", bottomForm: ["children"] },
        },
      },
      { "app/Note:1": { _id: "Note:1", children: ["Child:1"] } },
    );

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(configData(store)["entity:Note"].attributes).toEqual({
      children: CHILD_FIELD,
    });
  });

  it("keeps a configured bottomForm showing relatedEntities, even if it cannot link anything", async () => {
    const store = seed(
      {
        ...childAndSchoolTypes,
        "entity:Note": { attributes: { children: CHILD_FIELD } },
        "view:note/:id": {
          component: "NoteDetails",
          config: {
            entityType: "Note",
            bottomForm: ["children", "relatedEntities"],
          },
        },
      },
      { "app/Note:1": { _id: "Note:1", children: ["Child:1"] } },
    );

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.status).toBe("no-change");
    expect(configData(store)["view:note/:id"].config.bottomForm).toEqual([
      "children",
      "relatedEntities",
    ]);
    expect(result.warnings).toEqual([
      expect.stringContaining("shows relatedEntities, but it has no entity"),
    ]);
  });

  it("does not link types in relatedEntities that another Note field links already", async () => {
    const participants = {
      dataType: "entity",
      isArray: true,
      additional: "Child",
    };
    const store = seed({
      ...childAndSchoolTypes,
      ...explicitNoteDetails,
      "entity:Note": { attributes: { participants } },
    });

    await noteLegacyChildSchoolFields.run(buildTestContext(store));

    expect(configData(store)["entity:Note"].attributes).toEqual({
      participants,
      relatedEntities: { ...RELATED_ENTITIES_FIELD, additional: ["School"] },
    });
  });

  it("warns about entity types extending Note", async () => {
    const store = seed({
      ...explicitNoteDetails,
      "entity:EventNote": { extends: "Note" },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store),
    );

    expect(result.warnings).toEqual([
      expect.stringContaining("entity:EventNote extends Note"),
    ]);
  });

  it("uses the labels of the system's default language", async () => {
    const store = seed(childAndSchoolTypes, {
      "app/SiteSettings:global": {
        _id: "SiteSettings:global",
        defaultLanguage: "de",
      },
      "app/Note:1": {
        _id: "Note:1",
        children: ["Child:1"],
        schools: ["School:1"],
      },
    });

    await noteLegacyChildSchoolFields.run(buildTestContext(store));

    const attributes = configData(store)["entity:Note"].attributes;
    expect(attributes.children.label).toBe("Teilnehmer:innen");
    expect(attributes.schools.label).toBe("Gruppen");
  });

  it("does not write anything in dry-run mode", async () => {
    const store = seed(childAndSchoolTypes, {
      "app/Note:1": { _id: "Note:1", children: ["Child:1"] },
    });

    const result = await noteLegacyChildSchoolFields.run(
      buildTestContext(store, true),
    );

    expect(result.status).toBe("dry-run");
    expect(configData(store)).toEqual(childAndSchoolTypes);
  });

  describe("legacy childrenAttendance field", () => {
    it("restores it for Note docs holding attendance data, without asking", async () => {
      const store = seed(
        { ...childAndSchoolTypes, ...explicitNoteDetails },
        {
          "app/Note:1": {
            _id: "Note:1",
            childrenAttendance: [{ participant: "Child:1" }],
          },
        },
      );
      const confirm = vi.fn(async () => false);

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store, false, [], confirm),
      );

      expect(confirm).not.toHaveBeenCalled();
      expect(result.status).toBe("ok");
      expect(
        configData(store)["entity:Note"].attributes.childrenAttendance,
      ).toEqual(ATTENDANCE_FIELD);
    });

    it("restores it for docs of an entity type extending Note", async () => {
      const store = seed(
        {
          ...childAndSchoolTypes,
          ...explicitNoteDetails,
          "entity:EventNote": { extends: "Note" },
        },
        {
          "app/EventNote:1": {
            _id: "EventNote:1",
            childrenAttendance: [{ participant: "Child:1" }],
          },
        },
      );

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(result.status).toBe("ok");
      expect(
        configData(store)["entity:Note"].attributes.childrenAttendance,
      ).toEqual(ATTENDANCE_FIELD);
    });

    it("writes a restored field into the config of entity types extending Note", async () => {
      // an extending type only picks up a configured parent field if entity:Note comes first
      const store = seed(
        {
          ...childAndSchoolTypes,
          ...explicitNoteDetails,
          "entity:EventNote": { extends: "Note" },
        },
        {
          "app/EventNote:1": {
            _id: "EventNote:1",
            children: ["Child:1"],
            childrenAttendance: [{ participant: "Child:1" }],
          },
        },
      );

      await noteLegacyChildSchoolFields.run(buildTestContext(store));

      expect(configData(store)["entity:EventNote"].attributes).toEqual({
        children: CHILD_FIELD,
        childrenAttendance: ATTENDANCE_FIELD,
      });
      expect(configData(store)["entity:EventNote"].extends).toBe("Note");
    });

    it("restores it for an event type recording attendance through it", async () => {
      const store = seed({
        ...childAndSchoolTypes,
        ...explicitNoteDetails,
        "appConfig:attendance": {
          eventTypes: [
            { eventType: "Note", activityType: "RecurringActivity" },
          ],
        },
      });

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(result.status).toBe("ok");
      expect(
        configData(store)["entity:Note"].attributes.childrenAttendance,
      ).toEqual(ATTENDANCE_FIELD);
    });

    it("does not restore it for an event type using a different attendance field", async () => {
      const store = seed({
        ...childAndSchoolTypes,
        ...explicitNoteDetails,
        "appConfig:attendance": {
          eventTypes: [{ eventType: "Note", attendanceField: "attendance" }],
        },
      });

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(
        configData(store)["entity:Note"]?.attributes?.childrenAttendance,
      ).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });

    it("does not restore it if no doc holds attendance data", async () => {
      const store = seed(
        { ...childAndSchoolTypes, ...explicitNoteDetails },
        {
          "app/Note:1": {
            _id: "Note:1",
            children: ["Child:1"],
            childrenAttendance: [],
          },
        },
      );

      await noteLegacyChildSchoolFields.run(buildTestContext(store));

      expect(
        configData(store)["entity:Note"]?.attributes?.childrenAttendance,
      ).toBeUndefined();
    });

    it("removes it from the config of a system holding no attendance data", async () => {
      const store = seed({
        ...childAndSchoolTypes,
        ...explicitNoteDetails,
        "entity:Note": { attributes: { childrenAttendance: ATTENDANCE_FIELD } },
      });

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(result.status).toBe("ok");
      expect(
        configData(store)["entity:Note"].attributes.childrenAttendance,
      ).toBeUndefined();
      expect(result.verdicts).toContainEqual({
        kind: "remove",
        text: "remove unused legacy childrenAttendance field",
      });
    });

    it("keeps it if a SQL report mentions it", async () => {
      const store = seed(
        {
          ...childAndSchoolTypes,
          ...explicitNoteDetails,
          "entity:Note": {
            attributes: { childrenAttendance: ATTENDANCE_FIELD },
          },
        },
        {
          "app/ReportConfig:1": {
            _id: "ReportConfig:1",
            mode: "sql",
            reportDefinition: [
              {
                query: "SELECT * FROM Note n, json_each(n.childrenAttendance)",
              },
            ],
          },
        },
      );

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(
        configData(store)["entity:Note"].attributes.childrenAttendance,
      ).toEqual(ATTENDANCE_FIELD);
      expect(result.warnings).toBeUndefined();
    });

    it("leaves a custom field of the same name untouched", async () => {
      const customField = { label: "Attendance notes", dataType: "string" };
      const store = seed({
        ...childAndSchoolTypes,
        ...explicitNoteDetails,
        "entity:Note": { attributes: { childrenAttendance: customField } },
      });

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(result.warnings).toBeUndefined();
      expect(
        configData(store)["entity:Note"].attributes.childrenAttendance,
      ).toEqual(customField);
    });
  });

  it("checks the data of all legacy fields with a single query", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      ...explicitNoteDetails,
      "entity:Note": { attributes: { children: CHILD_FIELD } },
    });
    const ctx = buildTestContext(store);

    await noteLegacyChildSchoolFields.run(ctx);

    expect(ctx.couchdb.find).toHaveBeenCalledTimes(1);
    expect(ctx.couchdb.find).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [
          "_id",
          "children",
          "schools",
          "childrenAttendance",
          "relatedEntities",
        ],
      }),
    );
  });

  it("checks the docs of entity types extending Note, too", async () => {
    const store = seed({
      ...childAndSchoolTypes,
      ...explicitNoteDetails,
      "entity:EventNote": { extends: "Note" },
    });
    const ctx = buildTestContext(store);

    await noteLegacyChildSchoolFields.run(ctx);

    expect(ctx.couchdb.find).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: expect.objectContaining({
          _id: { $gt: "EventNote:", $lt: "EventNote:\uFFF0" },
        }),
      }),
    );
  });

  it("checks fields separately if the batch is full of matches for another field", async () => {
    const store = seed({ ...childAndSchoolTypes, ...explicitNoteDetails });
    const confirm = vi.fn(async () => true);
    const ctx = buildTestContext(store, false, [], confirm);
    const fullBatch = Array.from({ length: 1000 }, (_, i) => ({
      _id: `Note:${i}`,
      children: ["Child:1"],
    }));
    ctx.couchdb.find = vi.fn(async (query: any) =>
      query.limit === 1
        ? [{ _id: "Note:other", schools: ["School:1"] }]
        : fullBatch,
    );

    await noteLegacyChildSchoolFields.run(ctx);

    expect(ctx.couchdb.find).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ["_id", "schools"], limit: 1 }),
    );
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("1000+ Note docs have data"),
    );
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("1+ Note docs have data"),
    );
    expect(configData(store)["entity:Note"].attributes).toEqual({
      children: CHILD_FIELD,
      schools: SCHOOL_FIELD,
    });
  });

  describe("verdicts", () => {
    it("names restored fields and the kept note details form", async () => {
      const store = seed(childAndSchoolTypes, {
        "app/Note:1": { _id: "Note:1", children: ["Child:1"] },
      });

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(result.verdicts).toEqual([
        { kind: "add", text: "add config for legacy children field" },
        { kind: "add", text: "keep legacy children in note details form" },
      ]);
    });

    it("names removed fields and the configured relatedEntities", async () => {
      const store = seed({
        ...childAndSchoolTypes,
        "entity:Note": { attributes: { children: CHILD_FIELD } },
        "view:note": {
          component: "EntityList",
          config: { entityType: "Note", columns: ["schools"] },
        },
      });

      const result = await noteLegacyChildSchoolFields.run(
        buildTestContext(store),
      );

      expect(result.verdicts).toEqual([
        { kind: "remove", text: "remove unused legacy children field" },
        {
          kind: "remove",
          text: "remove references to unused legacy schools field",
        },
        {
          kind: "add",
          text: "configure relatedEntities to link Child, School",
        },
      ]);
    });

    it("says no change, and whether warnings need a review", async () => {
      const unchanged = await noteLegacyChildSchoolFields.run(
        buildTestContext(seed(explicitNoteDetails)),
      );
      const withWarning = await noteLegacyChildSchoolFields.run(
        buildTestContext(
          seed({
            ...explicitNoteDetails,
            "entity:EventNote": { extends: "Note" },
          }),
        ),
      );

      expect(unchanged.verdicts).toEqual([{ kind: "none", text: "no change" }]);
      expect(withWarning.verdicts).toEqual([
        { kind: "none", text: "no change" },
        { kind: "review", text: "needs review (1 warning)" },
      ]);
    });
  });

  it("is idempotent", async () => {
    const result = await runIdempotencyCheck(
      noteLegacyChildSchoolFields,
      seed(childAndSchoolTypes, {
        "app/Note:1": {
          _id: "Note:1",
          children: ["Child:1"],
          childrenAttendance: [["Child:1", { status: "PRESENT" }]],
        },
      }),
    );

    expect(result.firstRunResult.changed).toBe(true);
    expect(result.secondRunResult.status).toBe("no-change");
    expect(result.stateAfterSecondRun).toEqual(result.stateAfterFirstRun);
  });
});
