import { inject, Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { Ability, subject } from "@casl/ability";
import { Entity } from "../../../entity/model/entity";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { ConfigurableEnumService } from "../../../basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumDatatype } from "../../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { EntityAbility } from "../../../permissions/ability/entity-ability";

/**
 * Minimal structural type of the CASL rules (see `Ability.rulesFor`)
 * that condition validators are derived from.
 */
interface RuleWithConditions {
  conditions?: Record<string, any>;
  inverted?: boolean;
}

const MATCH_ACTION = "match";
const MATCH_SUBJECT = "PermissionConditionCheck";

/**
 * Derives form validators and human-readable messages from the `conditions`
 * of the current user's permission rules, so unmet conditions surface as
 * normal field errors instead of only a technical rejection when saving.
 */
@Injectable({ providedIn: "root" })
export class PermissionConditionValidatorsService {
  private readonly ability = inject(EntityAbility);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly enumService = inject(ConfigurableEnumService);

  /**
   * Validator reflecting the current user's permission rule conditions for the
   * given field, or `null` if the field's value cannot be the reason for a
   * denied save.
   */
  forField(entity: Entity, fieldId: string): ValidatorFn | null {
    const action = entity.isNew ? "create" : "update";
    const rules = this.ability.rulesFor(action, entity.getType());
    const schemaField = entity.getSchema().get(fieldId);

    // rule conditions are evaluated against entities in database format
    return buildPermissionConditionValidator(
      rules,
      fieldId,
      (value) =>
        this.entitySchemaService.valueToDatabaseFormat(
          value,
          schemaField,
          entity,
        ),
      this.getConditionValueFormatter(schemaField),
    );
  }

  /**
   * Human-readable summary of the values the current user's permission rule
   * conditions require on the entity (empty string if no rule has conditions),
   * e.g. to explain a denied save.
   */
  describeRequiredValues(action: "create" | "update", entity: Entity): string {
    return this.ability
      .rulesFor(action, entity.getType())
      .filter(
        (r) =>
          !r.inverted && r.conditions && Object.keys(r.conditions).length > 0,
      )
      .map((r) =>
        Object.entries(r.conditions)
          .map(([field, fragment]) => {
            const schemaField = entity.getSchema().get(field);
            const description = describeConditionFragment(
              fragment,
              this.getConditionValueFormatter(schemaField),
            );
            return `${schemaField?.label ?? field}: ${description}`;
          })
          .join(", "),
      )
      .join($localize`:joining alternative permission conditions: or `);
  }

  /**
   * Human-readable display of a single (database-format) condition value,
   * resolving configurable-enum ids to their labels.
   */
  private getConditionValueFormatter(
    schemaField: EntitySchemaField | undefined,
  ): ((value: any) => string) | undefined {
    if (schemaField?.dataType !== ConfigurableEnumDatatype.dataType) {
      return undefined;
    }
    return (value) =>
      this.enumService
        .getEnumValues(schemaField.additional)
        .find((option) => option.id === value)?.label ?? String(value);
  }
}

/**
 * Create a form validator that checks a single field's value against the
 * permission rule `conditions` restricting it, so that users see a normal
 * field error instead of only a technical rejection when saving.
 *
 * Returns `null` if the field's value cannot be the reason for a denied save,
 * i.e. if any granting rule does not restrict this field. Inverted ("cannot")
 * rules and conditions on properties without a form control (e.g. "created.by")
 * are not covered here and remain handled by the save-time permission check.
 *
 * @param rules The relevant CASL rules for the action and entity type (`ability.rulesFor(...)`)
 * @param fieldId The form field / entity property to validate
 * @param toDbFormat Transformation of the control value into database format,
 *   as rule conditions are evaluated against database-format entities
 * @param formatValue Lookup of a human-readable display for a single
 *   (database-format) condition value, e.g. resolving enum ids to labels
 */
export function buildPermissionConditionValidator(
  rules: RuleWithConditions[],
  fieldId: string,
  toDbFormat: (value: any) => any = (value) => value,
  formatValue?: (value: any) => string,
): ValidatorFn | null {
  const grantingRules = rules.filter((r) => !r.inverted);
  const fieldRestrictedByAllRules =
    grantingRules.length > 0 &&
    grantingRules.every((r) => r.conditions && fieldId in r.conditions);
  if (!fieldRestrictedByAllRules) {
    return null;
  }

  const fragments = grantingRules.map((r) => r.conditions[fieldId]);
  const matcher = new Ability(
    fragments.map((fragment) => ({
      action: MATCH_ACTION,
      subject: MATCH_SUBJECT,
      conditions: { [fieldId]: fragment },
    })),
  );
  const allowedValues = fragments
    .map((fragment) => describeConditionFragment(fragment, formatValue))
    .join(" / ");

  return (control) => {
    let value = control.value;
    if (value !== undefined && value !== null) {
      try {
        value = toDbFormat(value);
      } catch {
        // value cannot be evaluated reliably against the (database-format)
        // conditions; leave the denial to the save-time permission check
        return null;
      }
    }

    const checkedObject = value === undefined ? {} : { [fieldId]: value };
    if (matcher.can(MATCH_ACTION, subject(MATCH_SUBJECT, checkedObject))) {
      return null;
    }

    return {
      permissionCondition: {
        allowedValues,
        errorMessage: $localize`:form field error for value outside the user's permissions:Your permissions only allow the following value(s) here\: ${allowedValues}`,
      },
    };
  };
}

/**
 * Human-readable summary of a single permission condition fragment
 * (the value of one key in a CASL rule's `conditions` object).
 *
 * @param fragment The condition fragment to describe
 * @param formatValue Lookup of a human-readable display for a single value,
 *   e.g. resolving enum ids to labels
 */
export function describeConditionFragment(
  fragment: any,
  formatValue: (value: any) => string = (value) => String(value),
): string {
  if (fragment === null) {
    return String(fragment);
  }
  if (typeof fragment !== "object") {
    return formatValue(fragment);
  }
  if (Array.isArray(fragment)) {
    return fragment.map(formatValue).join(", ");
  }

  const operators = Object.entries(fragment);
  if (operators.length === 1) {
    const [operator, value] = operators[0];
    if (operator === "$eq") {
      return describeConditionFragment(value, formatValue);
    }
    if (operator === "$in" && Array.isArray(value)) {
      return value.map(formatValue).join(", ");
    }
  }
  return JSON.stringify(fragment);
}
