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
 *   without the field, these notes are no longer linked to the referenced records, and the app erases the links
 *   from a note the next time it is saved (only fields of the schema are written),
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
  id: "v4-upgrade-note-legacy-child-school-fields",
  description:
    "Write the legacy Note children/schools/childrenAttendance fields (previously defined in code) and the previous default NoteDetails bottomForm into the config of systems using them, and remove them (with their references) where they hold no data. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    let config: StoredConfig;
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

    const migration = await LegacyNoteFieldsMigration.load(ctx, config);
    return migration.run();
  },
};

type StoredConfig = { data: Record<string, any> } & Record<string, any>;

/** Where a legacy link field is used, deciding whether it is kept, restored or removed */
interface LinkFieldUsage {
  legacy: LegacyNoteField;
  field: string;
  /** the field's definition in `entity:Note` of the stored config, if any */
  configured: any;
  /** whether the entity type the field links (Child / School) exists in the config */
  typeExists: boolean;
  configReferences: string[];
  formReferences: string[];
  /** config and PublicFormConfig references together */
  references: string[];
}

/** The state of a system's config and data the migration decides on, loaded up front */
interface LegacyNoteFieldsInput {
  ctx: MigrationContext;
  /** the stored config doc, changed in place */
  config: StoredConfig;
  /** the config data in the latest format, to detect usages (only targeted changes are written to `config`) */
  migratedData: Record<string, any>;
  usesDefaultBottomForm: boolean;
  /** fields of the explicitly configured note details form - a deliberate choice of the admins, kept as it is */
  configuredFormFields: string[];
  publicForms: any[];
  reports: any[];
  permissions: any;
  warnings: string[];
  language: LabelLanguage;
  /** `Note` and the entity types extending it (e.g. the legacy roll-call type EventNote) */
  noteBasedTypes: string[];
  noteData: { counts: Map<string, number>; complete: boolean };
}

/** One run of {@link noteLegacyChildSchoolFields} on a system's config */
class LegacyNoteFieldsMigration {
  /** each change to the config, as a conclusion for the operator */
  private readonly verdicts: MigrationVerdict[] = [];
  /** the doc types the counts cover, e.g. "Note" or "Note / EventNote" */
  private readonly countedTypes: string;

  private constructor(private readonly input: LegacyNoteFieldsInput) {
    this.countedTypes = input.noteBasedTypes.join(" / ");
  }

  private get ctx() {
    return this.input.ctx;
  }

  private get config() {
    return this.input.config;
  }

  private get migratedData() {
    return this.input.migratedData;
  }

  private get noteBasedTypes() {
    return this.input.noteBasedTypes;
  }

  private get warnings() {
    return this.input.warnings;
  }

  static async load(
    ctx: MigrationContext,
    config: StoredConfig,
  ): Promise<LegacyNoteFieldsMigration> {
    // detect usages on the latest config format (e.g. NotesManager -> EntityList with entityType)
    // but only write the targeted changes to the stored doc
    const migratedData: Record<string, any> = applyConfigMigrations(
      structuredClone(config),
    ).data;
    const noteDetailsConfig = migratedData[NOTE_DETAILS_VIEW]?.config;
    const configuredFormFields = ["topForm", "middleForm", "bottomForm"]
      .flatMap((part) => asArray(noteDetailsConfig?.[part] ?? []))
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

    const migration = new LegacyNoteFieldsMigration({
      ctx,
      config,
      migratedData,
      usesDefaultBottomForm: !noteDetailsConfig?.bottomForm,
      configuredFormFields,
      publicForms,
      reports,
      permissions,
      warnings,
      language,
      noteBasedTypes,
      noteData,
    });
    const fieldCounts = checkedFields
      .map((field) => `${field} ${migration.formatCount(field)}`)
      .join(", ");
    ctx.log.info(`${migration.countedTypes} docs with data: ${fieldCounts}`);
    return migration;
  }

  async run(): Promise<MigrationResult> {
    for (const legacy of LEGACY_NOTE_FIELDS) {
      await this.migrateLinkField(this.usageOf(legacy));
    }
    this.migrateAttendanceField();
    if (this.input.usesDefaultBottomForm) {
      this.keepPreviousDefaultBottomForm();
    }
    this.switchToRelatedEntities();
    this.warnIfRelatedEntitiesLinksNothing();
    this.warnAboutExtendingTypesMissingKeptFields();
    return this.finish();
  }

  private formatCount(field: string) {
    const noteData = this.input.noteData;
    return `${noteData.counts.get(field)}${noteData.complete ? "" : "+"}`;
  }

  private hasNoteData(field: string) {
    return this.input.noteData.counts.get(field) > 0;
  }

  /**
   * Write the field's definition into the config of every Note-based type that does not define it yet,
   * keeping a type's own (maybe customized) definition.
   * Not only into entity:Note: an extending type picks up a *configured* parent field
   * only if entity:Note happens to come first in the config doc
   * (it always inherited the field while Note declared it in code).
   */
  private restoreField(field: string, definition: any, reasons: string[]) {
    const data = this.config.data;
    const missingIn = this.noteBasedTypes.filter(
      (entityType) =>
        (entityType === "Note" || data[`entity:${entityType}`]) &&
        !data[`entity:${entityType}`]?.attributes?.[field],
    );
    if (missingIn.length === 0) {
      this.ctx.log.info(`${field} already in config of ${this.countedTypes}`);
      return;
    }
    const targets = missingIn
      .map((entityType) => `entity:${entityType}`)
      .join(", ");
    this.ctx.log.info(
      `Restoring ${field} in ${targets}: ${reasons.join("; ")}`,
    );
    for (const entityType of missingIn) {
      const target = (data[`entity:${entityType}`] ??= {});
      target.attributes ??= {};
      target.attributes[field] = structuredClone(definition);
    }
    this.verdicts.push({
      kind: "add",
      text: `add config for legacy ${field} field`,
    });
  }

  private restore(legacy: LegacyNoteField, reasons: string[]) {
    this.restoreField(
      legacy.field,
      { label: legacy.labels[this.input.language], ...legacy.definition },
      reasons,
    );
  }

  // every lookup below spans Note and the types extending it: an extending type inherited these
  // fields from the Note schema, so its views reference them and its config may define them
  private configReferencesOf(field: string) {
    return referencedConfigKeys(
      this.noteBasedTypes.flatMap((entityType) =>
        findConfigFieldReferences(this.migratedData, entityType, field),
      ),
    );
  }

  private formReferencesOf(field: string) {
    return [
      ...new Set(
        this.noteBasedTypes.flatMap((entityType) =>
          findDocsReferencingField(this.input.publicForms, entityType, field),
        ),
      ),
    ];
  }

  /** remove the field and its list references from every Note-based type, all or nothing */
  private removeFromConfig(field: string) {
    let data = this.config.data;
    const remaining: FieldReference[] = [];
    for (const entityType of this.noteBasedTypes) {
      const removal = removeFieldFromConfig({ data }, entityType, field);
      if (removal.data) {
        data = removal.data;
      } else {
        remaining.push(...removal.remaining);
      }
    }
    return remaining.length === 0 ? { data, remaining } : { remaining };
  }

  /** Apply the removal of a field without data (and its config references) */
  private applyRemoval(
    field: string,
    data: Record<string, any>,
    configReferences: string[],
    configured: boolean,
  ) {
    const removedReferences =
      configReferences.length > 0
        ? ` and its references in ${configReferences.join(", ")}`
        : "";
    this.ctx.log.info(
      `Removing unused entity:Note.${field} (0 ${this.countedTypes} docs have data in it)${removedReferences}`,
    );
    this.config.data = data;
    this.verdicts.push({
      kind: "remove",
      text: configured
        ? `remove unused legacy ${field} field`
        : `remove references to unused legacy ${field} field`,
    });
    this.warnAboutQueryUses(field);
  }

  /**
   * Non-SQL reports and permission rules using the field: they don't break without it (unlike SQL reports),
   * but silently stop matching anything through it, so they are named for a manual check.
   */
  private queryUsesOf(field: string) {
    const roles = findPermissionRolesMentioning(
      this.input.permissions,
      this.noteBasedTypes,
      field,
    );
    return [
      ...findQueryReportsMentioning(this.input.reports, field),
      ...(roles.length > 0
        ? [`Config:Permissions (rules of ${roles.join(", ")})`]
        : []),
    ];
  }

  private warnAboutQueryUses(field: string) {
    const uses = this.queryUsesOf(field);
    if (uses.length > 0) {
      this.warnings.push(
        `Note.${field} holds no data and is removed, but ${uses.join(", ")} still use it - review and update them manually`,
      );
    }
  }

  private usageOf(legacy: LegacyNoteField): LinkFieldUsage {
    const field = legacy.field;
    const configReferences = this.configReferencesOf(field);
    const formReferences = this.formReferencesOf(field);
    return {
      legacy,
      field,
      configured: this.config.data["entity:Note"]?.attributes?.[field],
      typeExists: !!this.migratedData[`entity:${legacy.entityType}`],
      configReferences,
      formReferences,
      references: [...configReferences, ...formReferences],
    };
  }

  private async migrateLinkField(usage: LinkFieldUsage) {
    const { legacy, field, configured } = usage;
    if (configured && !isLegacyDefinition(configured, legacy)) {
      this.ctx.log.info(
        `entity:Note.${field} is a custom field (not a link to ${legacy.entityType}), left untouched`,
      );
      return;
    }
    if (this.hasNoteData(field)) {
      await this.keepUsedLinkField(usage);
    } else {
      // no data: users never filled this field, so it should not leave a trace
      this.cleanUpUnusedLinkField(usage);
    }
  }

  private async keepUsedLinkField(usage: LinkFieldUsage) {
    const { legacy, field, configured, references } = usage;
    const reasons = [
      `${this.formatCount(field)} ${this.countedTypes} docs have data in it`,
    ];
    if (configured) {
      // only needed by extending types that miss entity:Note's definition
      this.restoreField(field, configured, reasons);
      return;
    }
    if (!usage.typeExists) {
      this.warnings.push(
        `Note.${field} is used (${reasons.join("; ")}) but entity:${legacy.entityType} does not exist, not restored - its data is erased the next time each note is saved, review manually`,
      );
      return;
    }
    if (references.length > 0) {
      reasons.push(`referenced in ${references.join(", ")}`);
    } else if (this.input.usesDefaultBottomForm) {
      reasons.push(`shown by the default ${NOTE_DETAILS_VIEW} bottomForm`);
    } else if (!(await this.confirmRestoringUnshownField(legacy))) {
      // no view shows the field anymore, only the data is left
      return;
    }
    this.restore(legacy, reasons);
  }

  /** Ask the operator whether to restore a field with data that no view shows anymore */
  private async confirmRestoringUnshownField(legacy: LegacyNoteField) {
    const field = legacy.field;
    const queryUses = this.queryUsesOf(field);
    const usedBy =
      queryUses.length > 0 ? ` (and ${queryUses.join(", ")} use it)` : "";
    const dataCount = `${this.formatCount(field)} ${this.countedTypes} docs have data in it${usedBy}`;
    const confirmed = await this.ctx.confirm(
      `Note.${field} is not shown in any view, but ${dataCount}. Restore the field to keep these notes linked to their ${legacy.entityType} records? Declining erases these links the next time each note is saved.`,
      `restore-${field}`,
    );
    if (!confirmed) {
      this.warnings.push(
        `Note.${field} not restored (declined), although ${dataCount} - these links are erased the next time each note is saved`,
      );
    }
    return confirmed;
  }

  private cleanUpUnusedLinkField(usage: LinkFieldUsage) {
    const { field, configured, configReferences, references } = usage;
    if (!configured && references.length === 0) {
      // the field only came from code, which drops it
      this.warnAboutQueryUses(field);
      return;
    }
    if (this.input.configuredFormFields.includes(field)) {
      this.keepFieldShownInConfiguredForm(usage);
      return;
    }

    let keepReason = this.reasonToKeepUnusedField(usage);
    if (!keepReason) {
      const removal = this.removeFromConfig(field);
      if (removal.data) {
        this.applyRemoval(field, removal.data, configReferences, !!configured);
        return;
      }
      keepReason = `the references in ${referencedConfigKeys(removal.remaining).join(", ")} cannot be removed automatically`;
    }
    this.keepUnusedField(usage, keepReason);
  }

  private keepFieldShownInConfiguredForm({
    legacy,
    field,
    configured,
    typeExists,
  }: LinkFieldUsage) {
    const reason = `shown in the configured ${NOTE_DETAILS_VIEW} form`;
    if (configured) {
      this.ctx.log.info(`Keeping unused entity:Note.${field}: ${reason}`);
      this.verdicts.push({
        kind: "none",
        text: `keep unused legacy ${field} field (shown in configured note details form)`,
      });
    } else if (typeExists) {
      this.restore(legacy, [reason]);
    } else {
      this.warnings.push(
        `Note.${field} is ${reason}, but neither holds data nor does entity:${legacy.entityType} exist - review manually`,
      );
    }
  }

  /** Why a field without data cannot be removed, if anything prevents it apart from config references */
  private reasonToKeepUnusedField({
    field,
    configured,
    formReferences,
  }: LinkFieldUsage): string | undefined {
    if (formReferences.length > 0) {
      return `used in ${formReferences.join(", ")}`;
    }
    if (!configured) {
      return undefined;
    }
    const mentioningReports = findSqlReportsMentioning(
      this.input.reports,
      field,
    );
    return mentioningReports.length > 0
      ? `mentioned in SQL ${mentioningReports.join(", ")}`
      : undefined;
  }

  private keepUnusedField(
    { legacy, field, configured, typeExists, references }: LinkFieldUsage,
    keepReason: string,
  ) {
    if (configured) {
      this.warnings.push(
        `entity:Note.${field} holds no data but is kept: ${keepReason} - review manually`,
      );
    } else if (typeExists) {
      this.warnings.push(
        `Note.${field} holds no data but is restored: ${keepReason} - review manually`,
      );
      this.restore(legacy, [`referenced in ${references.join(", ")}`]);
    } else {
      this.warnings.push(
        `Note.${field} is referenced in ${references.join(", ")} but neither holds data nor does entity:${legacy.entityType} exist - review manually`,
      );
    }
  }

  /**
   * `childrenAttendance` was never shown in a view and has no label: it was edited through the
   * `EditLegacyAttendance` component of `children` and read by the roll-call UI of Note-based event types.
   * So it is restored whenever something still needs it, without asking the operator.
   */
  private migrateAttendanceField() {
    const configuredAttendances = this.noteBasedTypes
      .map(
        (entityType) =>
          this.config.data[`entity:${entityType}`]?.attributes?.[
            ATTENDANCE_FIELD
          ],
      )
      .filter((definition) => !!definition);
    if (
      configuredAttendances.some(
        (definition) => !isLegacyAttendanceDefinition(definition),
      )
    ) {
      this.ctx.log.info(
        `entity:Note.${ATTENDANCE_FIELD} is a custom field (not the legacy attendance format), left untouched`,
      );
      return;
    }

    const configReferences = this.configReferencesOf(ATTENDANCE_FIELD);
    const references = [
      ...configReferences,
      ...this.formReferencesOf(ATTENDANCE_FIELD),
    ];
    const reasons = this.attendanceFieldUses(references);
    if (reasons.length > 0) {
      this.restoreField(
        ATTENDANCE_FIELD,
        this.config.data["entity:Note"]?.attributes?.[ATTENDANCE_FIELD] ??
          LEGACY_NOTE_ATTENDANCE_FIELD.definition,
        reasons,
      );
    } else if (configuredAttendances.length > 0 || references.length > 0) {
      // no data and nothing using it: it should not leave a trace
      this.removeUnusedAttendanceField(
        configReferences,
        configuredAttendances.length > 0,
      );
    } else {
      // the field only came from code, which drops it
      this.warnAboutQueryUses(ATTENDANCE_FIELD);
    }
  }

  /** Everything that still needs the legacy attendance field, as reasons to restore it */
  private attendanceFieldUses(references: string[]): string[] {
    const reasons: string[] = [];
    if (this.hasNoteData(ATTENDANCE_FIELD)) {
      reasons.push(
        `${this.formatCount(ATTENDANCE_FIELD)} ${this.countedTypes} docs have data in it`,
      );
    }
    const rollCallTypes = this.rollCallTypesUsingAttendanceField();
    if (rollCallTypes.length > 0) {
      reasons.push(
        `${[...new Set(rollCallTypes)].join(", ")} records attendance through it (${ATTENDANCE_CONFIG_KEY})`,
      );
    }
    if (references.length > 0) {
      reasons.push(`referenced in ${references.join(", ")}`);
    }
    const mentioningReports = findSqlReportsMentioning(
      this.input.reports,
      ATTENDANCE_FIELD,
    );
    if (mentioningReports.length > 0) {
      reasons.push(`mentioned in SQL ${mentioningReports.join(", ")}`);
    }
    return reasons;
  }

  /** the roll-call UI resolves the attendance field from the schema of its event type */
  private rollCallTypesUsingAttendanceField(): string[] {
    return asArray(this.migratedData[ATTENDANCE_CONFIG_KEY]?.eventTypes ?? [])
      .filter(
        (eventType: any) =>
          this.noteBasedTypes.includes(eventType?.eventType) &&
          (eventType?.attendanceField ?? ATTENDANCE_FIELD) === ATTENDANCE_FIELD,
      )
      .map((eventType: any) => eventType.eventType);
  }

  private removeUnusedAttendanceField(
    configReferences: string[],
    configured: boolean,
  ) {
    const removal = this.removeFromConfig(ATTENDANCE_FIELD);
    if (removal.data) {
      this.applyRemoval(
        ATTENDANCE_FIELD,
        removal.data,
        configReferences,
        configured,
      );
    } else {
      this.warnings.push(
        `entity:Note.${ATTENDANCE_FIELD} holds no data but is kept: the references in ${referencedConfigKeys(removal.remaining).join(", ")} cannot be removed automatically - review manually`,
      );
    }
  }

  /** Write the previous default bottomForm for the legacy fields holding data, as the default now only shows relatedEntities */
  private keepPreviousDefaultBottomForm() {
    const usedLegacyFields = LEGACY_NOTE_FIELDS.map((l) => l.field).filter(
      (field) =>
        this.config.data["entity:Note"]?.attributes?.[field] &&
        this.hasNoteData(field),
    );
    if (usedLegacyFields.length === 0) {
      return;
    }
    this.ctx.log.info(
      `Setting the previous default ${NOTE_DETAILS_VIEW} bottomForm for the fields holding data: ${usedLegacyFields.join(", ")}`,
    );
    const view = (this.config.data[NOTE_DETAILS_VIEW] ??= {
      component: "NoteDetails",
    });
    view.config ??= structuredClone(LEGACY_NOTE_DETAILS_CONFIG);
    view.config.bottomForm = usedLegacyFields;
    this.verdicts.push({
      kind: "add",
      text: `keep legacy ${usedLegacyFields.join(", ")} in note details form`,
    });
  }

  /**
   * A system not linking notes to Child / School records through the legacy fields anymore
   * links them through `relatedEntities` instead, which by default (code) does not allow any entity type.
   */
  private switchToRelatedEntities() {
    const noteAttributes = this.config.data["entity:Note"]?.attributes ?? {};
    const keepsLegacyFields = LEGACY_NOTE_FIELDS.some((legacy) =>
      isLegacyDefinition(noteAttributes[legacy.field], legacy),
    );
    if (keepsLegacyFields) {
      return;
    }
    const configuredRelatedEntities = noteAttributes.relatedEntities;
    const relatedTypes: string[] = configuredRelatedEntities
      ? asArray(configuredRelatedEntities.additional ?? [])
      : [];
    const switchedTypes = LEGACY_NOTE_FIELDS.map((l) => l.entityType).filter(
      (type) =>
        this.migratedData[`entity:${type}`] &&
        !relatedTypes.includes(type) &&
        !linkedByOtherField(noteAttributes, type),
    );
    if (switchedTypes.length === 0) {
      return;
    }
    if (configuredRelatedEntities) {
      this.ctx.log.info(
        `Notes switch to relatedEntities, adding ${switchedTypes.join(", ")} to the types it links`,
      );
      configuredRelatedEntities.additional = [
        ...relatedTypes,
        ...switchedTypes,
      ];
      this.verdicts.push({
        kind: "add",
        text: `add ${switchedTypes.join(", ")} to the types relatedEntities links`,
      });
    } else {
      this.ctx.log.info(
        `Notes switch to relatedEntities, configuring it to link ${switchedTypes.join(", ")}`,
      );
      const noteConfig = (this.config.data["entity:Note"] ??= {});
      noteConfig.attributes ??= {};
      noteConfig.attributes.relatedEntities = relatedEntitiesDefinition(
        this.input.language,
        switchedTypes,
      );
      this.verdicts.push({
        kind: "add",
        text: `configure relatedEntities to link ${switchedTypes.join(", ")}`,
      });
    }
  }

  private warnIfRelatedEntitiesLinksNothing() {
    const detailsConfig = this.config.data[NOTE_DETAILS_VIEW]?.config ?? {};
    const bottomForm: string[] = detailsConfig.bottomForm ?? [
      "relatedEntities",
    ];
    this.ctx.log.info(
      `${NOTE_DETAILS_VIEW} bottomForm: [${bottomForm.join(", ")}]${detailsConfig.bottomForm ? "" : " (default)"}`,
    );
    const shownInForm = [
      ...(detailsConfig.topForm ?? []),
      ...(detailsConfig.middleForm ?? []),
      ...bottomForm,
    ].map((field) => field?.id ?? field);
    const linkedTypes = asArray(
      this.config.data["entity:Note"]?.attributes?.relatedEntities
        ?.additional ?? [],
    );
    if (shownInForm.includes("relatedEntities") && linkedTypes.length === 0) {
      this.warnings.push(
        `${NOTE_DETAILS_VIEW} shows relatedEntities, but it has no entity types to link configured - review`,
      );
    }
  }

  /**
   * Fields holding data are written into each extending type above,
   * but a legacy field kept in entity:Note without data is only inherited if entity:Note comes first in the doc.
   */
  private warnAboutExtendingTypesMissingKeptFields() {
    const noteAttributes = this.config.data["entity:Note"]?.attributes ?? {};
    const keptInNote = [
      ...LEGACY_NOTE_FIELDS.filter((legacy) =>
        isLegacyDefinition(noteAttributes[legacy.field], legacy),
      ).map((legacy) => legacy.field),
      ...(isLegacyAttendanceDefinition(noteAttributes[ATTENDANCE_FIELD])
        ? [ATTENDANCE_FIELD]
        : []),
    ];
    for (const entityType of this.noteBasedTypes.filter((t) => t !== "Note")) {
      const missing = keptInNote.filter(
        (field) =>
          !this.config.data[`entity:${entityType}`]?.attributes?.[field],
      );
      if (missing.length > 0) {
        this.warnings.push(
          `entity:${entityType} extends Note but does not configure ${missing.join(", ")} itself, which it only inherits if entity:Note comes first in the config doc - review manually`,
        );
      }
    }
  }

  private async finish(): Promise<MigrationResult> {
    const verdicts = this.verdicts;
    const warnings = this.warnings;
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
      status: resultStatus(changed, this.ctx.dryRun),
      warnings: warnings.length > 0 ? warnings : undefined,
      verdicts,
    };
    if (changed) {
      this.ctx.validateJson(this.config);
      await this.ctx.put(CONFIG_DOC_PATH, this.config);
    } else {
      this.ctx.log.info("No legacy Note config needs to be changed");
    }
    return result;
  }
}

function resultStatus(
  changed: boolean,
  dryRun: boolean,
): MigrationResult["status"] {
  if (!changed) {
    return "no-change";
  }
  return dryRun ? "dry-run" : "ok";
}

/** Whether another configured Note field (e.g. a custom one) already links records of the entity type */
function linkedByOtherField(noteAttributes: Record<string, any>, type: string) {
  return Object.entries(noteAttributes).some(
    ([key, definition]) =>
      key !== "relatedEntities" &&
      isEntityLinkDefinition(definition) &&
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
    isEntityLinkDefinition(definition) &&
    asArray(definition.additional ?? []).includes(legacy.entityType)
  );
}

/**
 * Whether a stored field definition links records,
 * also in the outdated `entity-array` format (only converted to `entity` by the config migrations on load).
 */
function isEntityLinkDefinition(definition: any) {
  return (
    definition?.dataType === "entity" || definition?.dataType === "entity-array"
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
      counts.set(field, counts.get(field) + typeCounts.counts.get(field));
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
