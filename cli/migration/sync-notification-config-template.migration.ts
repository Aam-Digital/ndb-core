import {
  failedMigrationResult,
  type MigrationContext,
  type MigrationDefinition,
  type MigrationResult,
} from "./migration-definition.js";

const TEMPLATE_PATH = "/app/Config:NotificationConfigTemplate";
const FULL_OVERWRITE_ARG = "full";

/**
 * The parts of `NotificationRule` (`src/app/features/notification/model/notification-config.ts`)
 * this migration reads or writes. Declared locally (instead of importing the `@DatabaseField`-decorated
 * class) to keep the CLI's TypeScript project free of Angular entity decorators.
 */
interface NotificationRuleLike {
  label?: string;
  notificationType: string;
  enabled: boolean;
  channels?: Record<string, boolean>;
  entityType?: string;
  changeType?: string[];
  conditions: unknown;
}

interface NotificationConfigDoc {
  _id: string;
  notificationRules?: NotificationRuleLike[];
}

/**
 * Identifies "the same" rule across the template and a user's config, regardless of its label or
 * conditions (so a renamed label or a fixed condition updates the existing rule instead of adding
 * a duplicate). The template should not define two rules with the same key - only the second would
 * ever be matched against an existing rule.
 */
function ruleKey(rule: NotificationRuleLike): string {
  return JSON.stringify([
    rule.notificationType,
    rule.entityType ?? null,
    [...(rule.changeType ?? [])].sort(),
  ]);
}

/**
 * Copy the `Config:NotificationConfigTemplate` rules into every existing `NotificationConfig:<user>` doc.
 *
 * The template is only applied automatically when a user's config is first created
 * (`NotificationSettingsComponent.createNewNotificationConfig`) - a later edit to the template
 * (e.g. renaming a rule's label, fixing its conditions, or adding a new rule) never reaches users
 * who already have a config. This migration re-syncs it:
 * - a template rule not yet present (matched by `notificationType` + `entityType` + `changeType`,
 *   ignoring label and conditions, see {@link ruleKey}) is added, with the template's `enabled` /
 *   `channels` as its defaults
 * - a matching rule has its `label` and `conditions` updated to the template's current version;
 *   its `enabled` / `channels` are left as the user configured them
 * - run with the `full` argument to instead overwrite the whole matched rule, including `enabled` /
 *   `channels`, discarding the user's customization of it
 * - a rule in a user's config with no match in the template is left untouched (e.g. a rule the user
 *   added themselves, or one removed from the template since)
 *
 * Safe to re-run.
 */
export const syncNotificationConfigTemplate: MigrationDefinition = {
  id: "sync-notification-config-template",
  description:
    'Copy Config:NotificationConfigTemplate rules into every existing NotificationConfig:<user> doc: add missing rules, update label/conditions of matching ones. Run with "full" to also overwrite enabled/channels of matching rules. Safe to re-run.',

  async run(ctx: MigrationContext): Promise<MigrationResult> {
    if (
      ctx.args.length > 1 ||
      (ctx.args.length === 1 && ctx.args[0] !== FULL_OVERWRITE_ARG)
    ) {
      return failedMigrationResult(
        `Expected no argument or "${FULL_OVERWRITE_ARG}", got ${JSON.stringify(ctx.args)}`,
      );
    }
    const fullOverwrite = ctx.args[0] === FULL_OVERWRITE_ARG;

    let template: { data?: { notificationRules?: NotificationRuleLike[] } };
    try {
      template = await ctx.couchdb.get(TEMPLATE_PATH);
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        ctx.log.info(
          "No NotificationConfigTemplate configured, nothing to sync",
        );
        return { changed: false, status: "no-change" };
      }
      throw error;
    }

    const templateRules = template.data?.notificationRules;
    if (!Array.isArray(templateRules) || templateRules.length === 0) {
      ctx.log.info(
        "NotificationConfigTemplate has no notificationRules, nothing to sync",
      );
      return { changed: false, status: "no-change" };
    }

    const configs = (await ctx.couchdb.getAll(
      "NotificationConfig",
    )) as NotificationConfigDoc[];

    let changedDocs = 0;
    for (const config of configs) {
      const rules = [...(config.notificationRules ?? [])];
      const indexByKey = new Map(
        rules.map((rule, index) => [ruleKey(rule), index]),
      );
      let docChanged = false;

      for (const templateRule of templateRules) {
        const key = ruleKey(templateRule);
        const index = indexByKey.get(key);

        if (index === undefined) {
          indexByKey.set(key, rules.length);
          rules.push(structuredClone(templateRule));
          docChanged = true;
          continue;
        }

        const existing = rules[index];
        if (fullOverwrite) {
          if (JSON.stringify(existing) !== JSON.stringify(templateRule)) {
            rules[index] = structuredClone(templateRule);
            docChanged = true;
          }
        } else if (
          existing.label !== templateRule.label ||
          JSON.stringify(existing.conditions) !==
            JSON.stringify(templateRule.conditions)
        ) {
          rules[index] = {
            ...existing,
            label: templateRule.label,
            conditions: structuredClone(templateRule.conditions),
          };
          docChanged = true;
        }
      }

      if (!docChanged) continue;
      changedDocs++;
      const newConfig = { ...config, notificationRules: rules };
      ctx.validateJson(newConfig);
      ctx.log.info(`Syncing notification rules for ${config._id}`);
      await ctx.put(`/app/${config._id}`, newConfig);
    }

    if (changedDocs === 0) {
      ctx.log.info("All NotificationConfig docs already match the template");
      return { changed: false, status: "no-change" };
    }

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
