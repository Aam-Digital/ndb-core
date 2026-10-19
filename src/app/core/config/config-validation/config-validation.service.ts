import { inject, Injectable, Injector } from "@angular/core";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { EntityConfig } from "../../entity/entity-config";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { DefaultValueStrategy } from "../../default-values/default-value-strategy.interface";
import { DYNAMIC_VALIDATORS } from "../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { resolveIconDefinition } from "../../common-components/fa-dynamic-icon/fa-icon-utils";
import { MenuItem } from "../../ui/navigation/menu-item";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { AlertService } from "../../alerts/alert.service";
import { Logging } from "../../logging/logging.service";
import { Config } from "../config";

/**
 * A problem in the config that the app can work around at runtime
 * (e.g. by falling back to a default), but which an admin should fix.
 */
export interface ConfigProblem {
  /** id of the config item, e.g. "entity:Child" */
  configId: string;
  /** the field of an entity type the problem is in, if any */
  field?: string;
  /** human-readable description of the problem, including a hint how to fix it */
  message: string;
}

const ENTITY_CONFIG_PREFIX = "entity:";
const NAVIGATION_MENU_CONFIG_ID = "navigationMenu";

/**
 * Checks the config for problems that would otherwise only show up at runtime
 * (as a silently ignored setting), so that admins can be told about them when saving.
 *
 * Problems are not reported to remote monitoring: they are instance configuration,
 * not bugs in our code (see "Error Handling & Remote Logging" in AGENTS.md).
 */
@Injectable({
  providedIn: "root",
})
export class ConfigValidationService {
  // resolved lazily: the checked services (e.g. datatypes, default value strategies) may depend on the ConfigService
  private readonly injector = inject(Injector);

  /**
   * Tell the current user about problems in the given (just saved) config,
   * if they are allowed to edit the config.
   * Saving is not blocked: problems are only shown as a warning.
   */
  warnAdminAboutProblems(config: Record<string, any>): void {
    if (this.injector.get(EntityAbility).cannot("update", Config)) {
      return;
    }
    const problems = this.validate(config);
    if (problems.length === 0) {
      return;
    }

    Logging.debug("Saved config has problems", problems);
    const listed = problems.map((p) => `• ${formatProblem(p)}`);
    this.injector
      .get(AlertService)
      .addWarning(
        $localize`:config validation:The configuration has problems that should be fixed:` +
          "\n" +
          listed.join("\n"),
      );
  }

  /**
   * Check the given config data (the full config document's `data`).
   * @returns the problems found, empty if the config is fine
   */
  validate(config: Record<string, any> | undefined | null): ConfigProblem[] {
    if (!config || typeof config !== "object") {
      return [];
    }

    const problems: ConfigProblem[] = [];
    for (const [configId, value] of Object.entries(config)) {
      if (configId.startsWith(ENTITY_CONFIG_PREFIX)) {
        problems.push(...this.validateEntityConfig(configId, value, config));
      } else if (configId === NAVIGATION_MENU_CONFIG_ID) {
        problems.push(...this.validateMenuItems(configId, value?.items));
      }
    }
    return problems;
  }

  private validateEntityConfig(
    configId: string,
    entityConfig: EntityConfig,
    config: Record<string, any>,
  ): ConfigProblem[] {
    const problems: ConfigProblem[] = [];
    if (entityConfig?.icon && !this.isKnownIcon(entityConfig.icon)) {
      problems.push({
        configId,
        message: $localize`:config validation:Unknown icon "${entityConfig.icon}:icon:". A default icon is shown instead.`,
      });
    }

    for (const [field, schema] of Object.entries(
      entityConfig?.attributes ?? {},
    )) {
      problems.push(
        ...this.validateField(schema, config).map((message) => ({
          configId,
          field,
          message,
        })),
      );
    }
    return problems;
  }

  private validateField(
    schema: EntitySchemaField,
    config: Record<string, any>,
  ): string[] {
    if (!schema || typeof schema !== "object") {
      return [];
    }
    const problems: string[] = [];

    if (schema.dataType && !this.isKnownDataType(schema.dataType)) {
      // e.g. `dataType: "School"` where a link to "School" records was intended
      const isEntityType =
        this.injector.get(EntityRegistry).has(schema.dataType) ||
        !!config[ENTITY_CONFIG_PREFIX + schema.dataType];
      problems.push(
        isEntityType
          ? $localize`:config validation:Unknown data type "${schema.dataType}:dataType:". To link to records of this type, use data type "entity" and select "${schema.dataType}:dataType:" as the linked record type.`
          : $localize`:config validation:Unknown data type "${schema.dataType}:dataType:". The field is treated as plain text.`,
      );
    }

    for (const validator of Object.keys(schema.validators ?? {})) {
      if (!(DYNAMIC_VALIDATORS as readonly string[]).includes(validator)) {
        problems.push(
          validator === "regex"
            ? $localize`:config validation:Unknown validator "regex", it is ignored. Use "pattern" instead.`
            : $localize`:config validation:Unknown validator "${validator}:validator:", it is ignored.`,
        );
      }
    }

    if (schema.defaultValue && !this.isKnownDefaultValueMode(schema)) {
      problems.push(
        schema.defaultValue.mode
          ? $localize`:config validation:The default value has no valid mode ("${schema.defaultValue.mode}:mode:"), so it is not applied.`
          : $localize`:config validation:The default value has no mode, so it is not applied.`,
      );
    }

    return problems;
  }

  private validateMenuItems(
    configId: string,
    items: MenuItem[] | undefined,
  ): ConfigProblem[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.flatMap((item) => [
      ...(item?.icon && !this.isKnownIcon(item.icon)
        ? [
            {
              configId,
              message: $localize`:config validation:Unknown icon "${item.icon}:icon:" for menu item "${item.label}:label:". A default icon is shown instead.`,
            },
          ]
        : []),
      ...this.validateMenuItems(configId, item?.subMenu),
    ]);
  }

  private isKnownDataType(dataType: string): boolean {
    try {
      this.injector
        .get(EntitySchemaService)
        .getDatatypeOrDefault(dataType, false);
      return true;
    } catch {
      return false;
    }
  }

  private isKnownDefaultValueMode(schema: EntitySchemaField): boolean {
    const strategies = this.injector.get(
      DefaultValueStrategy,
    ) as unknown as DefaultValueStrategy[];
    return strategies.some((s) => s.mode === schema.defaultValue?.mode);
  }

  private isKnownIcon(icon: string): boolean {
    return !!resolveIconDefinition(icon, this.injector.get(FaIconLibrary));
  }
}

function formatProblem(problem: ConfigProblem): string {
  const location = problem.field
    ? `${problem.configId} → ${problem.field}`
    : problem.configId;
  return `${location}: ${problem.message}`;
}
