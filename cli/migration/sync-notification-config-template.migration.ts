import {
  failedMigrationResult,
  type MigrationContext,
  type MigrationDefinition,
  type MigrationResult,
} from "./migration-definition.js";

const TEMPLATE_PATH = "/app/Config:NotificationConfigTemplate";
const FULL_ARG = "full";
const REPLACE_ARG = "replace";
const VALID_ARGS = [FULL_ARG, REPLACE_ARG];
type Mode = typeof FULL_ARG | typeof REPLACE_ARG | undefined;

/** The parts of `NotificationRule` (notification-config.ts) this migration reads or writes, declared locally to avoid importing the `@DatabaseField`-decorated class into the CLI. */
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

/** Identifies "the same" rule across the template and a user's config, ignoring label/conditions so a rename or a conditions fix updates in place instead of adding a duplicate. */
function ruleKey(rule: NotificationRuleLike): string {
  return JSON.stringify([
    rule.notificationType,
    rule.entityType ?? null,
    [...(rule.changeType ?? [])].sort(),
  ]);
}

/** The template rules that share a key with another template rule, grouped by that key. */
function duplicateTemplateRuleGroups(
  templateRules: NotificationRuleLike[],
): NotificationRuleLike[][] {
  const byKey = new Map<string, NotificationRuleLike[]>();
  for (const rule of templateRules) {
    const key = ruleKey(rule);
    const group = byKey.get(key) ?? [];
    group.push(rule);
    byKey.set(key, group);
  }
  return [...byKey.values()].filter((group) => group.length > 1);
}

/** The one rule among same-key candidates that exactly matches the template rule's label or conditions, or `undefined` if that isn't unambiguous. */
function findUnambiguousMatch(
  candidates: NotificationRuleLike[],
  templateRule: NotificationRuleLike,
): NotificationRuleLike | undefined {
  if (candidates.length <= 1) {
    return candidates[0];
  }
  const byLabel = candidates.filter((c) => c.label === templateRule.label);
  if (byLabel.length === 1) {
    return byLabel[0];
  }
  const byConditions = candidates.filter(
    (c) =>
      JSON.stringify(c.conditions) === JSON.stringify(templateRule.conditions),
  );
  return byConditions.length === 1 ? byConditions[0] : undefined;
}

/** Merge a template rule into a user's existing rules, in place; returns whether it changed anything. */
function applyTemplateRule(
  rules: NotificationRuleLike[],
  templateRule: NotificationRuleLike,
  fullOverwrite: boolean,
  warnings: string[],
  docId: string,
): boolean {
  const key = ruleKey(templateRule);
  const candidates = rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => ruleKey(rule) === key);

  if (candidates.length === 0) {
    rules.push(structuredClone(templateRule));
    return true;
  }

  const match = findUnambiguousMatch(
    candidates.map((c) => c.rule),
    templateRule,
  );
  if (!match) {
    warnings.push(
      `${docId}: ${candidates.length} existing rules match the template rule ` +
        `"${templateRule.label ?? templateRule.notificationType}" (same notificationType/entityType/changeType) ` +
        `but none matches its label or conditions exactly - left unchanged, review manually`,
    );
    return false;
  }

  const index = candidates.find((c) => c.rule === match)!.index;
  const existing = rules[index];

  if (fullOverwrite) {
    if (JSON.stringify(existing) === JSON.stringify(templateRule)) {
      return false;
    }
    rules[index] = structuredClone(templateRule);
    return true;
  }

  if (
    existing.label === templateRule.label &&
    JSON.stringify(existing.conditions) ===
      JSON.stringify(templateRule.conditions)
  ) {
    return false;
  }
  rules[index] = {
    ...existing,
    label: templateRule.label,
    conditions: structuredClone(templateRule.conditions),
  };
  return true;
}

/**
 * Copy the `Config:NotificationConfigTemplate` rules into every existing `NotificationConfig:<user>` doc.
 *
 * The template is only applied automatically when a user's config is first created
 * (`NotificationSettingsComponent.createNewNotificationConfig`) - a later edit to the template
 * (e.g. renaming a rule's label, fixing its conditions such as `$current_user`, or adding a rule)
 * never reaches users who already have a config. This migration re-syncs it. By default, for each
 * template rule:
 * - if no existing rule shares its `notificationType` + `entityType` + `changeType` (see {@link ruleKey}),
 *   it is added, with the template's `enabled` / `channels` as its defaults
 * - if exactly one existing rule shares that key (or, when several do, exactly one matches the
 *   template rule's label or conditions exactly), that rule's `label` and `conditions` are updated to
 *   the template's current version; its `enabled` / `channels` are left as the user configured them
 * - if several existing rules share that key and none matches unambiguously, the template rule is
 *   left for that doc with a warning, rather than guessing
 * - an existing rule with no matching key in the template is left untouched (e.g. one the user added
 *   themselves, or one removed from the template since)
 *
 * Takes an optional argument to change this:
 * - `full`: like the default, but a matched rule is overwritten entirely (including `enabled` /
 *   `channels`), discarding the user's customization of it
 * - `replace`: the user's `notificationRules` are replaced wholesale with the template's, discarding
 *   anything not in the template
 *
 * Safe to re-run.
 */
export const syncNotificationConfigTemplate: MigrationDefinition = {
  id: "sync-notification-config-template",
  description:
    'Copy Config:NotificationConfigTemplate rules into every existing NotificationConfig:<user> doc: add missing rules, update label/conditions of matching ones. Run with "full" to also overwrite enabled/channels of matching rules, or "replace" to replace each user\'s rules wholesale with the template\'s. Safe to re-run.',

  async run(ctx: MigrationContext): Promise<MigrationResult> {
    if (
      ctx.args.length > 1 ||
      (ctx.args.length === 1 && !VALID_ARGS.includes(ctx.args[0]))
    ) {
      return failedMigrationResult(
        `Expected no argument or one of ${VALID_ARGS.map((a) => `"${a}"`).join(", ")}, got ${JSON.stringify(ctx.args)}`,
      );
    }
    const mode = ctx.args[0] as Mode;

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

    if (mode !== REPLACE_ARG) {
      const duplicates = duplicateTemplateRuleGroups(templateRules);
      if (duplicates.length > 0) {
        return failedMigrationResult(
          "NotificationConfigTemplate has several rules with the same notificationType/entityType/changeType, " +
            `so it is ambiguous which one an existing rule should be matched against: ${duplicates
              .map((group) =>
                group
                  .map((r) => `"${r.label ?? r.notificationType}"`)
                  .join(" / "),
              )
              .join("; ")}`,
        );
      }
    }

    const configs = (await ctx.couchdb.getAll(
      "NotificationConfig",
    )) as NotificationConfigDoc[];

    let changedDocs = 0;
    const warnings: string[] = [];
    for (const config of configs) {
      let rules: NotificationRuleLike[];
      let docChanged: boolean;

      if (mode === REPLACE_ARG) {
        docChanged =
          JSON.stringify(config.notificationRules ?? []) !==
          JSON.stringify(templateRules);
        rules = structuredClone(templateRules);
      } else {
        rules = structuredClone(config.notificationRules ?? []);
        docChanged = false;
        for (const templateRule of templateRules) {
          if (
            applyTemplateRule(
              rules,
              templateRule,
              mode === FULL_ARG,
              warnings,
              config._id,
            )
          ) {
            docChanged = true;
          }
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
      return {
        changed: false,
        status: "no-change",
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    return {
      changed: true,
      status: ctx.dryRun ? "dry-run" : "ok",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
};
