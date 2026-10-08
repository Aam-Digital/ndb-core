import { applyConfigMigrations } from "../../src/app/core/config/config-migrations.js";
import {
  failedMigrationResult,
  type MigrationContext,
  type MigrationDefinition,
  type MigrationResult,
  type MigrationVerdict,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";
import { asArray } from "../../src/app/utils/asArray.js";
import {
  countDocsWithFieldData,
  type FieldReference,
  findConfigFieldReferences,
  findDocsReferencingField,
  findPermissionRolesMentioning,
  findQueryReportsMentioning,
  findSqlReportsMentioning,
  referencedConfigKeys,
  removeFieldFromConfig,
} from "./field-usage.js";
import {
  LABEL_LANGUAGES,
  type LabelLanguage,
  LEGACY_NOTE_ATTENDANCE_FIELD,
  LEGACY_NOTE_FIELDS,
  type LegacyNoteField,
} from "../../src/app/child-dev-project/notes/deprecated/legacy-note-fields.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SITE_SETTINGS_PATH = "/app/SiteSettings:global";
const PERMISSIONS_PATH = "/app/Config:Permissions";
const NOTE_DETAILS_VIEW = "view:note/:id";
/** `AttendanceService.CONFIG_KEY`: the roll-call event types of the attendance feature */
const ATTENDANCE_CONFIG_KEY = "appConfig:attendance";
const ATTENDANCE_FIELD = LEGACY_NOTE_ATTENDANCE_FIELD.field;

/** Snapshot of the NoteDetails view that used to be added in code if a system had none */
const LEGACY_NOTE_DETAILS_CONFIG = {
  entityType: "Note",
  topForm: ["date", "warningLevel", "category", "authors", "attachment"],
  middleForm: ["subject", "text"],
};

/**
 * Configured `relatedEntities` field (as in the base configs) for systems switching to it,
 * as the code definition of `Note` does not allow linking any entity type (`additional`).
 */
function relatedEntitiesDefinition(
  language: LabelLanguage,
  linkedTypes: string[],
) {
  // translations of the `$localize` label of the code definition
  const labels: Record<LabelLanguage, string> = {
    en: "Related Records",
    de: "Verknüpfte Datensätze",
    fr: "Enregistrements associés",
  };
  return {
    label: labels[language],
    dataType: "entity",
    additional: linkedTypes,
    isArray: true,
    entityReferenceRole: "composite",
    anonymize: "retain",
  };
}

/**
 * Persist the legacy `children`, `schools` and `childrenAttendance` Note fields into the config of systems
 * that use them, and remove them from the config of systems that don't.
 *
 * `Note` used to declare these fields in code and `view:note/:id` showed the link fields by default (`bottomForm`),
 * so every system had them, whether it used them or not. Code now only provides the generic `relatedEntities`.
 * Whether users actually used a field is judged by the data: a field that was shown,
 * but never filled in any Note doc, has been ignored by users and should not leave a trace.
 *
 * For a field holding data in Note docs (if its entity type Child / School exists in the config):
 * - its definition is added to `entity:Note` if the config (Note views, NotesRelatedToEntity components, ...)
 *   or a PublicFormConfig references it or it was shown by the previous default `bottomForm`,
 * - if no view shows it anymore, the operator is asked to confirm restoring it:
 *   without the field, these notes are no longer linked to the referenced records (the data itself is kept),
 * - if `view:note/:id` has no `bottomForm` (or does not exist), the previous default `bottomForm` is written
 *   for the legacy fields holding data, as the default now only shows `relatedEntities`.
 *
 * A system without any legacy field left in `entity:Note` (e.g. as none holds data) links notes through `relatedEntities`
 * instead. As the code definition of that field does not allow linking any entity type, its Child / School types
 * are added to the configured `additional` types (or the field is configured for them, like in the base configs),
 * unless another Note field links that type already.
 *
 * `childrenAttendance` is handled separately, as it was never shown in a view and has no label:
 * it was edited through the `EditLegacyAttendance` component of `children` and read by the roll-call UI.
 * It is restored (without asking) if any doc holds attendance data, if an `appConfig:attendance` event type
 * based on Note records attendance through it, or if the config / a PublicFormConfig / a SQL report uses it.
 * A system that never recorded attendance on notes does not get it back - that is what the new
 * `attendance` datatype is for (see `entity:Event` / `entity:ClassSession` of the base configs).
 *
 * Data is counted across `Note` and the entity types extending it (e.g. the legacy roll-call type `EventNote`),
 * which inherit these fields from the Note schema.
 * A field in use is written into the config of each of these types that does not define it yet:
 * an extending type only picks up a field *configured* for Note if `entity:Note` comes first in the config doc.
 *
 * For a field without any data, its legacy definition is removed from `entity:Note`,
 * together with references in lists of the config (columns, filters, form fields, ...).
 * An explicitly configured `view:note/:id` form is a deliberate choice of the system's admins and kept as it is,
 * so a legacy field shown there is kept (or restored) even without data.
 * It is kept instead (or restored, so that references don't break), with a warning,
 * if a reference cannot be removed automatically, a PublicFormConfig uses it,
 * or a SQL report mentions it (its column in the SQL schema is derived from the config).
 * Other reports and permission rules mentioning a removed field don't keep it, as nothing matched them through it
 * without data, but they are named in a warning to clean them up.
 *
 * Run this on all systems before deploying the app version that drops the fields from code.
 * Until that deployment, a removed field falls back to its code definition (and may still be shown by default),
 * so do a dry-run again afterwards: data entered in between makes the migration offer to restore the field.
 * Idempotent: re-running does not change anything anymore, and new systems hold no data in these fields.
 */
export const noteLegacyChildSchoolFields: MigrationDefinition = {
  id: "oneoff-20261008-note-legacy-child-school-fields",
  description:
    "Write the legacy Note children/schools/childrenAttendance fields (previously defined in code) and the previous default NoteDetails bottomForm into the config of systems using them, and remove them (with their references) where they hold no data. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    let config: { data: Record<string, any> } & Record<string, any>;
    try {
      config = structuredClone(await ctx.couchdb.get(CONFIG_DOC_PATH));
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        return failedMigrationResult("Config document not found");
      }
      throw error;
    }
    if (!config?.data || typeof config.data !== "object") {
      return failedMigrationResult("Config document has no data object");
    }

    // detect usages on the latest config format (e.g. NotesManager -> EntityList with entityType)
    // but only write the targeted changes to the stored doc
    const migratedData: Record<string, any> = applyConfigMigrations(
      structuredClone(config),
    ).data;
    const usesDefaultBottomForm =
      !migratedData[NOTE_DETAILS_VIEW]?.config?.bottomForm;
    /** fields of the explicitly configured note details form - a deliberate choice of the admins, kept as it is */
    const configuredFormFields = ["topForm", "middleForm", "bottomForm"]
      .flatMap((part) =>
        asArray(migratedData[NOTE_DETAILS_VIEW]?.config?.[part] ?? []),
      )
      .map((formField: any) => formField?.id ?? formField);
    const publicForms = (await ctx.couchdb.getAll("PublicFormConfig")) as any[];
    const reports = (await ctx.couchdb.getAll("ReportConfig")) as any[];
    const permissions = await getOptionalDoc(ctx, PERMISSIONS_PATH);
    const warnings: string[] = [];
    const language = await getDefaultLanguage(ctx, warnings);

    const checkedFields = [
      ...LEGACY_NOTE_FIELDS.map((legacy) => legacy.field),
      ATTENDANCE_FIELD,
      "relatedEntities",
    ];
    // entity types extending Note (e.g. the legacy roll-call type EventNote) inherit these fields
    // from the Note schema, so their docs hold the data that decides whether a field is in use
    const noteBasedTypes = [
      "Note",
      ...Object.entries<any>(migratedData)
        .filter(
          ([key, entityConfig]) =>
            key.startsWith("entity:") && entityConfig?.extends === "Note",
        )
        .map(([key]) => key.slice("entity:".length)),
    ];
    const noteData = await countNoteBasedDocsWithFieldData(
      ctx,
      noteBasedTypes,
      checkedFields,
    );
    /** the doc types the counts cover, e.g. "Note" or "Note / EventNote" */
    const countedTypes = noteBasedTypes.join(" / ");
    const formatCount = (field: string) =>
      `${noteData.counts.get(field)}${noteData.complete ? "" : "+"}`;
    const hasNoteData = (field: string) => noteData.counts.get(field)! > 0;
    ctx.log.info(
      `${countedTypes} docs with data: ${checkedFields.map((field) => `${field} ${formatCount(field)}`).join(", ")}`,
    );

    /** each change to the config, as a conclusion for the operator */
    const verdicts: MigrationVerdict[] = [];
    /**
     * Write the field's definition into the config of every Note-based type that does not define it yet,
     * keeping a type's own (maybe customized) definition.
     * Not only into entity:Note: an extending type picks up a *configured* parent field
     * only if entity:Note happens to come first in the config doc
     * (it always inherited the field while Note declared it in code).
     */
    const restoreField = (
      field: string,
      definition: any,
      reasons: string[],
    ) => {
      const missingIn = noteBasedTypes.filter(
        (entityType) =>
          (entityType === "Note" || config.data[`entity:${entityType}`]) &&
          !config.data[`entity:${entityType}`]?.attributes?.[field],
      );
      if (missingIn.length === 0) {
        ctx.log.info(`${field} already in config of ${countedTypes}`);
        return;
      }
      ctx.log.info(
        `Restoring ${field} in ${missingIn.map((entityType) => `entity:${entityType}`).join(", ")}: ${reasons.join("; ")}`,
      );
      for (const entityType of missingIn) {
        const target = (config.data[`entity:${entityType}`] ??= {});
        target.attributes ??= {};
        target.attributes[field] = structuredClone(definition);
      }
      verdicts.push({
        kind: "add",
        text: `add config for legacy ${field} field`,
      });
    };
    const restore = (legacy: LegacyNoteField, reasons: string[]) =>
      restoreField(
        legacy.field,
        { label: legacy.labels[language], ...legacy.definition },
        reasons,
      );

    // every lookup below spans Note and the types extending it: an extending type inherited these
    // fields from the Note schema, so its views reference them and its config may define them
    const configReferencesOf = (field: string) =>
      referencedConfigKeys(
        noteBasedTypes.flatMap((entityType) =>
          findConfigFieldReferences(migratedData, entityType, field),
        ),
      );
    const formReferencesOf = (field: string) => [
      ...new Set(
        noteBasedTypes.flatMap((entityType) =>
          findDocsReferencingField(publicForms, entityType, field),
        ),
      ),
    ];
    /** remove the field and its list references from every Note-based type, all or nothing */
    const removeFromConfig = (field: string) => {
      let data = config.data;
      const remaining: FieldReference[] = [];
      for (const entityType of noteBasedTypes) {
        const removal = removeFieldFromConfig({ data }, entityType, field);
        if (removal.data) {
          data = removal.data;
        } else {
          remaining.push(...removal.remaining);
        }
      }
      return remaining.length === 0 ? { data, remaining } : { remaining };
    };
    /**
     * Non-SQL reports and permission rules using the field: they don't break without it (unlike SQL reports),
     * but silently stop matching anything through it, so they are named for a manual check.
     */
    const queryUsesOf = (field: string) => {
      const roles = findPermissionRolesMentioning(
        permissions,
        noteBasedTypes,
        field,
      );
      return [
        ...findQueryReportsMentioning(reports, field),
        ...(roles.length > 0
          ? [`Config:Permissions (rules of ${roles.join(", ")})`]
          : []),
      ];
    };
    const warnAboutQueryUses = (field: string) => {
      const uses = queryUsesOf(field);
      if (uses.length > 0) {
        warnings.push(
          `Note.${field} holds no data and is removed, but ${uses.join(", ")} still use it - review and update them manually`,
        );
      }
    };

    for (const legacy of LEGACY_NOTE_FIELDS) {
      const field = legacy.field;
      const configured = config.data["entity:Note"]?.attributes?.[field];
      const typeExists = !!migratedData[`entity:${legacy.entityType}`];
      const configReferences = configReferencesOf(field);
      const formReferences = formReferencesOf(field);
      const references = [...configReferences, ...formReferences];

      if (hasNoteData(field)) {
        const reasons = [
          `${formatCount(field)} ${countedTypes} docs have data in it`,
        ];
        if (configured) {
          // only needed by extending types that miss entity:Note's definition
          restoreField(field, configured, reasons);
          continue;
        }
        if (!typeExists) {
          warnings.push(
            `Note.${field} is used (${reasons.join("; ")}) but entity:${legacy.entityType} does not exist, not restored - review manually`,
          );
          continue;
        }
        if (references.length > 0) {
          reasons.push(`referenced in ${references.join(", ")}`);
        } else if (usesDefaultBottomForm) {
          reasons.push(`shown by the default ${NOTE_DETAILS_VIEW} bottomForm`);
        } else {
          // no view shows the field anymore, only the data is left
          const queryUses = queryUsesOf(field);
          const usedBy =
            queryUses.length > 0 ? ` (and ${queryUses.join(", ")} use it)` : "";
          if (
            !(await ctx.confirm(
              `Note.${field} is not shown in any view, but ${formatCount(field)} ${countedTypes} docs have data in it${usedBy}. Restore the field to keep these notes linked to their ${legacy.entityType} records?`,
            ))
          ) {
            warnings.push(
              `Note.${field} not restored (declined), although ${formatCount(field)} ${countedTypes} docs have data in it${usedBy}`,
            );
            continue;
          }
        }
        restore(legacy, reasons);
        continue;
      }

      // no data: users never filled this field, so it should not leave a trace
      if (configured && !isLegacyDefinition(configured, legacy)) {
        ctx.log.info(
          `entity:Note.${field} is a custom field (not a link to ${legacy.entityType}), left untouched`,
        );
        continue;
      }
      if (!configured && references.length === 0) {
        // the field only came from code, which drops it
        warnAboutQueryUses(field);
        continue;
      }
      if (configuredFormFields.includes(field)) {
        const reason = `shown in the configured ${NOTE_DETAILS_VIEW} form`;
        if (configured) {
          ctx.log.info(`Keeping unused entity:Note.${field}: ${reason}`);
          verdicts.push({
            kind: "none",
            text: `keep unused legacy ${field} field (shown in configured note details form)`,
          });
        } else if (typeExists) {
          restore(legacy, [reason]);
        } else {
          warnings.push(
            `Note.${field} is ${reason}, but neither holds data nor does entity:${legacy.entityType} exist - review manually`,
          );
        }
        continue;
      }

      let keepReason: string | undefined;
      if (formReferences.length > 0) {
        keepReason = `used in ${formReferences.join(", ")}`;
      } else if (configured) {
        const mentioningReports = findSqlReportsMentioning(reports, field);
        if (mentioningReports.length > 0) {
          keepReason = `mentioned in SQL ${mentioningReports.join(", ")}`;
        }
      }
      if (!keepReason) {
        const removal = removeFromConfig(field);
        if (removal.data) {
          ctx.log.info(
            `Removing unused entity:Note.${field} (0 ${countedTypes} docs have data in it)` +
              (configReferences.length > 0
                ? ` and its references in ${configReferences.join(", ")}`
                : ""),
          );
          config.data = removal.data;
          verdicts.push({
            kind: "remove",
            text: configured
              ? `remove unused legacy ${field} field`
              : `remove references to unused legacy ${field} field`,
          });
          warnAboutQueryUses(field);
          continue;
        }
        keepReason = `the references in ${referencedConfigKeys(removal.remaining).join(", ")} cannot be removed automatically`;
      }

      if (configured) {
        warnings.push(
          `entity:Note.${field} holds no data but is kept: ${keepReason} - review manually`,
        );
      } else if (typeExists) {
        warnings.push(
          `Note.${field} holds no data but is restored: ${keepReason} - review manually`,
        );
        restore(legacy, [`referenced in ${references.join(", ")}`]);
      } else {
        warnings.push(
          `Note.${field} is referenced in ${references.join(", ")} but neither holds data nor does entity:${legacy.entityType} exist - review manually`,
        );
      }
    }

    // `childrenAttendance` was never shown in a view and has no label: it was edited through the
    // `EditLegacyAttendance` component of `children` and read by the roll-call UI of Note-based event types.
    // So it is restored whenever something still needs it, without asking the operator.
    const configuredAttendances = noteBasedTypes
      .map(
        (entityType) =>
          config.data[`entity:${entityType}`]?.attributes?.[ATTENDANCE_FIELD],
      )
      .filter((definition) => !!definition);
    if (
      configuredAttendances.some(
        (definition) => !isLegacyAttendanceDefinition(definition),
      )
    ) {
      ctx.log.info(
        `entity:Note.${ATTENDANCE_FIELD} is a custom field (not the legacy attendance format), left untouched`,
      );
    } else {
      const attendanceReasons: string[] = [];
      if (hasNoteData(ATTENDANCE_FIELD)) {
        attendanceReasons.push(
          `${formatCount(ATTENDANCE_FIELD)} ${countedTypes} docs have data in it`,
        );
      }
      // the roll-call UI resolves the attendance field from the schema of its event type
      const rollCallTypes: string[] = asArray(
        migratedData[ATTENDANCE_CONFIG_KEY]?.eventTypes ?? [],
      )
        .filter(
          (eventType: any) =>
            noteBasedTypes.includes(eventType?.eventType) &&
            (eventType?.attendanceField ?? ATTENDANCE_FIELD) ===
              ATTENDANCE_FIELD,
        )
        .map((eventType: any) => eventType.eventType);
      if (rollCallTypes.length > 0) {
        attendanceReasons.push(
          `${[...new Set(rollCallTypes)].join(", ")} records attendance through it (${ATTENDANCE_CONFIG_KEY})`,
        );
      }
      const attendanceConfigReferences = configReferencesOf(ATTENDANCE_FIELD);
      const attendanceFormReferences = formReferencesOf(ATTENDANCE_FIELD);
      const attendanceReferences = [
        ...attendanceConfigReferences,
        ...attendanceFormReferences,
      ];
      if (attendanceReferences.length > 0) {
        attendanceReasons.push(
          `referenced in ${attendanceReferences.join(", ")}`,
        );
      }
      const mentioningReports = findSqlReportsMentioning(
        reports,
        ATTENDANCE_FIELD,
      );
      if (mentioningReports.length > 0) {
        attendanceReasons.push(
          `mentioned in SQL ${mentioningReports.join(", ")}`,
        );
      }

      if (attendanceReasons.length > 0) {
        restoreField(
          ATTENDANCE_FIELD,
          config.data["entity:Note"]?.attributes?.[ATTENDANCE_FIELD] ??
            LEGACY_NOTE_ATTENDANCE_FIELD.definition,
          attendanceReasons,
        );
      } else if (
        configuredAttendances.length > 0 ||
        attendanceReferences.length > 0
      ) {
        // no data and nothing using it: it should not leave a trace
        const removal = removeFromConfig(ATTENDANCE_FIELD);
        if (removal.data) {
          ctx.log.info(
            `Removing unused entity:Note.${ATTENDANCE_FIELD} (0 ${countedTypes} docs have data in it)` +
              (attendanceConfigReferences.length > 0
                ? ` and its references in ${attendanceConfigReferences.join(", ")}`
                : ""),
          );
          config.data = removal.data;
          verdicts.push({
            kind: "remove",
            text:
              configuredAttendances.length > 0
                ? `remove unused legacy ${ATTENDANCE_FIELD} field`
                : `remove references to unused legacy ${ATTENDANCE_FIELD} field`,
          });
          warnAboutQueryUses(ATTENDANCE_FIELD);
        } else {
          warnings.push(
            `entity:Note.${ATTENDANCE_FIELD} holds no data but is kept: the references in ${referencedConfigKeys(removal.remaining).join(", ")} cannot be removed automatically - review manually`,
          );
        }
      } else {
        // the field only came from code, which drops it
        warnAboutQueryUses(ATTENDANCE_FIELD);
      }
    }

    if (usesDefaultBottomForm) {
      const usedLegacyFields = LEGACY_NOTE_FIELDS.map((l) => l.field).filter(
        (field) =>
          config.data["entity:Note"]?.attributes?.[field] && hasNoteData(field),
      );
      if (usedLegacyFields.length > 0) {
        ctx.log.info(
          `Setting the previous default ${NOTE_DETAILS_VIEW} bottomForm for the fields holding data: ${usedLegacyFields.join(", ")}`,
        );
        const view = (config.data[NOTE_DETAILS_VIEW] ??= {
          component: "NoteDetails",
        });
        view.config ??= structuredClone(LEGACY_NOTE_DETAILS_CONFIG);
        view.config.bottomForm = usedLegacyFields;
        verdicts.push({
          kind: "add",
          text: `keep legacy ${usedLegacyFields.join(", ")} in note details form`,
        });
      }
    }

    // a system not linking notes to Child / School records through the legacy fields anymore
    // links them through `relatedEntities` instead, which by default (code) does not allow any entity type
    const noteAttributes = config.data["entity:Note"]?.attributes ?? {};
    const keepsLegacyFields = LEGACY_NOTE_FIELDS.some((legacy) =>
      isLegacyDefinition(noteAttributes[legacy.field], legacy),
    );
    const configuredRelatedEntities = noteAttributes.relatedEntities;
    const relatedTypes: string[] = configuredRelatedEntities
      ? asArray(configuredRelatedEntities.additional ?? [])
      : [];
    const switchedTypes = keepsLegacyFields
      ? []
      : LEGACY_NOTE_FIELDS.map((l) => l.entityType).filter(
          (type) =>
            migratedData[`entity:${type}`] &&
            !relatedTypes.includes(type) &&
            !linkedByOtherField(noteAttributes, type),
        );
    if (switchedTypes.length > 0 && configuredRelatedEntities) {
      ctx.log.info(
        `Notes switch to relatedEntities, adding ${switchedTypes.join(", ")} to the types it links`,
      );
      configuredRelatedEntities.additional = [
        ...relatedTypes,
        ...switchedTypes,
      ];
      verdicts.push({
        kind: "add",
        text: `add ${switchedTypes.join(", ")} to the types relatedEntities links`,
      });
    } else if (switchedTypes.length > 0) {
      ctx.log.info(
        `Notes switch to relatedEntities, configuring it to link ${switchedTypes.join(", ")}`,
      );
      const noteConfig = (config.data["entity:Note"] ??= {});
      noteConfig.attributes ??= {};
      noteConfig.attributes.relatedEntities = relatedEntitiesDefinition(
        language,
        switchedTypes,
      );
      verdicts.push({
        kind: "add",
        text: `configure relatedEntities to link ${switchedTypes.join(", ")}`,
      });
    }

    const detailsConfig = config.data[NOTE_DETAILS_VIEW]?.config ?? {};
    const bottomForm: string[] = detailsConfig.bottomForm ?? [
      "relatedEntities",
    ];
    ctx.log.info(
      `${NOTE_DETAILS_VIEW} bottomForm: [${bottomForm.join(", ")}]${detailsConfig.bottomForm ? "" : " (default)"}`,
    );
    const shownInForm = [
      ...(detailsConfig.topForm ?? []),
      ...(detailsConfig.middleForm ?? []),
      ...bottomForm,
    ].map((field) => field?.id ?? field);
    if (
      shownInForm.includes("relatedEntities") &&
      asArray(
        config.data["entity:Note"]?.attributes?.relatedEntities?.additional ??
          [],
      ).length === 0
    ) {
      warnings.push(
        `${NOTE_DETAILS_VIEW} shows relatedEntities, but it has no entity types to link configured - review`,
      );
    }

    for (const [key, entityConfig] of Object.entries<any>(migratedData)) {
      if (key.startsWith("entity:") && entityConfig?.extends === "Note") {
        warnings.push(
          `${key} extends Note and may rely on the legacy children/schools/childrenAttendance fields of the Note core schema, which it only inherits if entity:Note configures them - review manually`,
        );
      }
    }

    const changed = verdicts.some(
      (verdict) => verdict.kind === "add" || verdict.kind === "remove",
    );
    if (verdicts.length === 0) {
      verdicts.push({ kind: "none", text: "no change" });
    }
    if (warnings.length > 0) {
      verdicts.push({
        kind: "review",
        text: `needs review (${warnings.length} warning${warnings.length > 1 ? "s" : ""})`,
      });
    }

    const result: MigrationResult = {
      changed,
      status: changed ? (ctx.dryRun ? "dry-run" : "ok") : "no-change",
      warnings: warnings.length > 0 ? warnings : undefined,
      verdicts,
    };
    if (!changed) {
      ctx.log.info("No legacy Note config needs to be changed");
      return result;
    }

    ctx.validateJson(config);
    await ctx.put(CONFIG_DOC_PATH, config);
    return result;
  },
};

/** Whether another configured Note field (e.g. a custom one) already links records of the entity type */
function linkedByOtherField(noteAttributes: Record<string, any>, type: string) {
  return Object.entries(noteAttributes).some(
    ([key, definition]) =>
      key !== "relatedEntities" &&
      definition?.dataType === "entity" &&
      asArray(definition.additional ?? []).includes(type),
  );
}

/** Whether a configured field is the legacy attendance field (and not a custom field sharing the name) */
function isLegacyAttendanceDefinition(definition: any) {
  return (
    definition?.dataType === LEGACY_NOTE_ATTENDANCE_FIELD.definition.dataType
  );
}

/** Whether a configured field is the legacy link field (and not a custom field that happens to share the name) */
function isLegacyDefinition(definition: any, legacy: LegacyNoteField) {
  return (
    definition?.dataType === "entity" &&
    asArray(definition.additional ?? []).includes(legacy.entityType)
  );
}

/**
 * Count the docs holding data in each field across `Note` and the entity types extending it
 * (which inherit the legacy fields from the Note schema), summing up the per-type counts.
 */
async function countNoteBasedDocsWithFieldData(
  ctx: MigrationContext,
  entityTypes: string[],
  fields: string[],
) {
  const counts = new Map(fields.map((field) => [field, 0]));
  let complete = true;
  for (const entityType of entityTypes) {
    const typeCounts = await countDocsWithFieldData(ctx, entityType, fields);
    for (const field of fields) {
      counts.set(field, counts.get(field)! + typeCounts.counts.get(field)!);
    }
    complete &&= typeCounts.complete;
  }
  return { counts, complete };
}

/**
 * The system's default language from SiteSettings, if the legacy labels have a translation for it.
 */
async function getDefaultLanguage(
  ctx: MigrationContext,
  warnings: string[],
): Promise<LabelLanguage> {
  const siteSettings = await getOptionalDoc(ctx, SITE_SETTINGS_PATH);
  const value = siteSettings?.defaultLanguage;
  const locale: string | undefined =
    typeof value === "string" ? value : value?.id;
  const language = locale?.split("-")[0];
  if (!language) {
    return "en";
  }
  if (!(LABEL_LANGUAGES as readonly string[]).includes(language)) {
    warnings.push(
      `No translation of the legacy labels for default language "${locale}", using English`,
    );
    return "en";
  }
  return language as LabelLanguage;
}

/** The doc at the given path, or `undefined` if it does not exist */
async function getOptionalDoc(
  ctx: MigrationContext,
  path: string,
): Promise<any> {
  try {
    return await ctx.couchdb.get(path);
  } catch (error: unknown) {
    if ((error as { status?: number }).status === 404) {
      return undefined;
    }
    throw error;
  }
}
