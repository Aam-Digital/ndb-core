import {
  failedMigrationResult,
  type MigrationDefinition,
  type MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

const ENUM_ART_PATH = "/app/ConfigurableEnum:artDerVeranstaltung";
const ENUM_ATTENDANCE_PATH = "/app/ConfigurableEnum:attendance-status";

const artDerVeranstaltungEnum = {
  _id: "ConfigurableEnum:artDerVeranstaltung",
  values: [
    { id: "", label: "" },
    { id: "WORKSHOP", label: "Workshop" },
    { id: "TREFFEN", label: "Treffen" },
    { id: "AUSFLUG", label: "Ausflug" },
  ],
};

const attendanceStatusEnum = {
  _id: "ConfigurableEnum:attendance-status",
  values: [
    { id: "", label: "" },
    { id: "EINGELADEN", label: "eingeladen" },
    { id: "ANWESEND", label: "anwesend" },
    { id: "ABWESEND", label: "abwesend" },
  ],
};

const eventEntity = {
  label: "Veranstaltung",
  route: "event",
  labelPlural: "Veranstaltungen",
  icon: "calendar",
  toStringAttributes: ["name"],
  hasPII: false,
  attributes: {
    name: { label: "Titel", dataType: "string" },
    date: { label: "Datum", dataType: "date-only" },
    teilnehmer_innen: {
      label: "Teilnehmer:innen",
      dataType: "attendance",
      additional: {
        participant: {
          dataType: "entity",
          additional: ["User", "School", "Child"],
        },
      },
      isArray: true,
    },
    anmerkungen: { label: "Anmerkungen / Agenda", dataType: "long-text" },
    verantwortliche: {
      label: "Verantwortliche",
      dataType: "entity",
      additional: "User",
      isArray: true,
    },
    artDerVeranstaltung: {
      label: "Art der Veranstaltung",
      dataType: "configurable-enum",
      additional: "artDerVeranstaltung",
    },
  },
};

const eventListView = {
  component: "EntityList",
  config: {
    entityType: "event",
    columnGroups: {
      default: "Overview",
      mobile: "Overview",
      groups: [
        {
          name: "Übersicht",
          columns: [
            "date",
            "name",
            "artDerVeranstaltung",
            "teilnehmer_innen",
            "verantwortliche",
          ],
        },
      ],
    },
    filters: [{ id: "date" }, { id: "verantwortliche" }],
  },
};

const eventDetailView = {
  component: "EntityDetails",
  config: {
    entityType: "event",
    panels: [
      {
        title: "Veranstaltung",
        components: [
          {
            title: "",
            component: "Form",
            config: {
              fieldGroups: [
                {
                  fields: [
                    "name",
                    "date",
                    "artDerVeranstaltung",
                    "teilnehmer_innen",
                    "anmerkungen",
                    "verantwortliche",
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: "Notizen & Aufgaben",
        components: [
          {
            title: "",
            component: "NotesRelatedToEntity",
            config: {
              entityType: "Note",
              columns: [
                { id: "date" },
                { id: "subject" },
                { id: "authors" },
                { id: "category" },
              ],
            },
          },
          {
            title: "Aufgaben",
            component: "TodosRelatedToEntity",
            config: {
              entityType: "Todo",
              columns: [
                { id: "subject" },
                { id: "deadline" },
                { id: "startDate" },
                { id: "assignedTo" },
              ],
            },
          },
        ],
      },
    ],
  },
};

const veranstaltungenComponent = {
  title: "Veranstaltungen",
  component: "RelatedEntities",
  config: {
    entityType: "event",
    columns: [{ id: "date" }, { id: "name" }, { id: "verantwortliche" }],
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */

function appendEventToRelatedEntities(
  data: Record<string, any>,
  entityKey: string,
  warnings: string[],
): boolean {
  const entity = data[entityKey];
  if (!entity) {
    warnings.push(`${entityKey} not found, skipping relatedEntities update`);
    return false;
  }
  const relatedEntities = entity.attributes?.relatedEntities;
  if (!relatedEntities) {
    warnings.push(`${entityKey} has no relatedEntities attribute, skipping`);
    return false;
  }
  const { additional } = relatedEntities;
  if (Array.isArray(additional)) {
    if (additional.includes("event")) return false;
    additional.push("event");
    return true;
  }
  if (typeof additional === "string") {
    relatedEntities.additional = [additional, "event"];
    return true;
  }
  warnings.push(
    `${entityKey} relatedEntities.additional has unexpected type (${typeof additional}), skipping`,
  );
  return false;
}

function appendEventToNavMenu(
  data: Record<string, any>,
  warnings: string[],
): boolean {
  const menu = data.navigationMenu;
  if (!menu || !Array.isArray(menu.items)) {
    warnings.push("navigationMenu.items not found or not an array, skipping");
    return false;
  }
  if (menu.items.some((item: any) => item.entityType === "event")) {
    return false;
  }
  const noteIndex = menu.items.findIndex(
    (item: any) => item.entityType === "Note",
  );
  if (noteIndex >= 0) {
    menu.items.splice(noteIndex, 0, { entityType: "event" });
  } else {
    menu.items.push({ entityType: "event" });
  }
  return true;
}

function addVeranstaltungenToDetailView(
  data: Record<string, any>,
  viewKey: string,
  warnings: string[],
): boolean {
  const view = data[viewKey];
  if (!view) {
    warnings.push(`${viewKey} not found, skipping Veranstaltungen component`);
    return false;
  }
  const panels: any[] | undefined = view.config?.panels;
  if (!Array.isArray(panels)) {
    warnings.push(`${viewKey} has no panels array, skipping`);
    return false;
  }

  for (const panel of panels) {
    if (!Array.isArray(panel.components)) continue;
    for (const comp of panel.components) {
      if (
        comp.component === "RelatedEntities" &&
        comp.config?.entityType === "event"
      ) {
        return false;
      }
    }
  }

  const targetPanel =
    panels.find((p) => p.title === "Notizen & Aufgaben") ??
    panels.find(
      (p) =>
        typeof p.title === "string" &&
        /notizen/i.test(p.title) &&
        /aufgaben/i.test(p.title),
    ) ??
    panels.find(
      (p) =>
        Array.isArray(p.components) &&
        p.components.some((c: any) => c.component === "NotesRelatedToEntity") &&
        p.components.some((c: any) => c.component === "TodosRelatedToEntity"),
    );

  if (!targetPanel) {
    warnings.push(
      `${viewKey}: no suitable tab found for Veranstaltungen component, needs manual review`,
    );
    return false;
  }

  if (!Array.isArray(targetPanel.components)) {
    targetPanel.components = [];
  }
  targetPanel.components.push(
    JSON.parse(JSON.stringify(veranstaltungenComponent)),
  );
  return true;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export const codoAddEventType: MigrationDefinition = {
  id: "codo-add-event-type",
  description:
    "Add Event entity type, views, enums, and navigation entry to codo systems. Use with --category codo.",

  async run(ctx): Promise<MigrationResult> {
    let config: Record<string, unknown>;
    try {
      config = (await ctx.couchdb.get(CONFIG_DOC_PATH)) as Record<
        string,
        unknown
      >;
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        return failedMigrationResult("Config document not found");
      }
      throw error;
    }

    const data = config.data as Record<string, unknown> | undefined;
    if (!data || typeof data !== "object") {
      return failedMigrationResult("Config document has no data object");
    }

    const warnings: string[] = [];
    let anyChange = false;

    if (await ctx.addDocIfMissing(ENUM_ART_PATH, artDerVeranstaltungEnum)) {
      anyChange = true;
    }
    if (await ctx.addDocIfMissing(ENUM_ATTENDANCE_PATH, attendanceStatusEnum)) {
      anyChange = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as Record<string, any>;
    let configChanged = false;

    const configEntries: [string, unknown][] = [
      ["entity:event", eventEntity],
      ["view:event", eventListView],
      ["view:event/:id", eventDetailView],
    ];
    for (const [key, template] of configEntries) {
      if (d[key]) {
        ctx.log.info(`${key} already exists, skipping`);
      } else {
        d[key] = JSON.parse(JSON.stringify(template));
        configChanged = true;
      }
    }

    for (const entityKey of ["entity:Note", "entity:Todo"]) {
      if (appendEventToRelatedEntities(d, entityKey, warnings))
        configChanged = true;
    }

    const noteRelated = d["entity:Note"]?.attributes?.relatedEntities;
    if (noteRelated && noteRelated.label !== "Sonstige verknüpfte Datensätze") {
      noteRelated.label = "Sonstige verknüpfte Datensätze";
      configChanged = true;
    }

    if (appendEventToNavMenu(d, warnings)) configChanged = true;

    for (const viewKey of ["view:mentor/:id", "view:mentee/:id"]) {
      if (addVeranstaltungenToDetailView(d, viewKey, warnings))
        configChanged = true;
    }

    if (configChanged) {
      ctx.validateJson(config);
      await ctx.put(CONFIG_DOC_PATH, config);
      anyChange = true;
    }

    if (!anyChange) ctx.log.info("No changes needed");

    return {
      changed: anyChange,
      status: anyChange ? (ctx.dryRun ? "dry-run" : "ok") : "no-change",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
};
