import { inject, Injectable } from "@angular/core";
import { DemoValueContext, DemoValueGenerator } from "./demo-value-generator";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { Logging } from "../../logging/logging.service";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.types";
import { DateWithAge } from "../../basic-datatypes/date-with-age/dateWithAge";
import { SchemaEmbedDatatypeAdditional } from "../../basic-datatypes/schema-embed/schema-embed.datatype";

/** A number the scenario spec or a validator sets, if it is one. */
function numberOption(
  context: DemoValueContext,
  field: EntitySchemaField,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = context.options[key] ?? field.validators?.[key];
    if (typeof value === "number") {
      return value;
    }
  }
  return undefined;
}

/**
 * The bounds for a field, in ascending order. A spec or a validator may set only one
 * of them, and faker rejects an inverted range - which would abort the whole run.
 */
function boundsOf(
  context: DemoValueContext,
  field: EntitySchemaField,
  keys: { min: string[]; max: string[] },
  fallback: { min: number; max: number },
): { min: number; max: number } {
  const min = numberOption(context, field, ...keys.min);
  const max = numberOption(context, field, ...keys.max);
  const bounds = [
    min ?? Math.min(fallback.min, max ?? fallback.min),
    max ?? Math.max(fallback.max, min ?? fallback.max),
  ];

  return { min: Math.min(...bounds), max: Math.max(...bounds) };
}

@Injectable()
export class ConfigurableEnumDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "configurable-enum";

  private readonly enums = inject(ConfigurableEnumService);

  generate(field: EntitySchemaField, context: DemoValueContext) {
    const values = this.enums.getEnumValues(field.additional);
    const ids = context.options.ids;
    if (!Array.isArray(ids)) {
      return this.pick(values, context);
    }

    // a spec can narrow the options, e.g. to the genders a use case records.
    // Falling back to all of them would contradict what it asked for, so an
    // id the enum does not have leaves the field empty instead.
    const allowed = values.filter((value) => ids.includes(value.id));
    if (allowed.length === 0) {
      Logging.debug("No such option in the demo data spec", {
        enum: field.additional,
        ids,
      });
      return undefined;
    }
    return this.pick(allowed, context);
  }

  /** An option that is actually offered: one without a label is a config placeholder. */
  private pick(options: ConfigurableEnumValue[], context: DemoValueContext) {
    const labelled = options.filter((value) => !!value.label);
    const offered = labelled.length ? labelled : options;

    return offered.length
      ? context.faker.helpers.arrayElement(offered)
      : undefined;
  }
}

@Injectable()
export class DateDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "date";

  generate(field: EntitySchemaField, context: DemoValueContext) {
    return context.faker.date.past({
      years: numberOption(context, field, "yearsPast") ?? 2,
    });
  }
}

@Injectable()
export class DateOnlyDemoValueGenerator extends DateDemoValueGenerator {
  override readonly dataType: string = "date-only";
}

@Injectable()
export class MonthDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "month";

  generate(_field: EntitySchemaField, context: DemoValueContext) {
    const date = context.faker.date.past({ years: 2 });
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}

@Injectable()
export class DateWithAgeDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "date-with-age";

  generate(field: EntitySchemaField, context: DemoValueContext) {
    return new DateWithAge(
      context.faker.date.birthdate({
        mode: "age",
        ...boundsOf(
          context,
          field,
          { min: ["min", "minAge"], max: ["max", "maxAge"] },
          { min: 5, max: 50 },
        ),
      }),
    );
  }
}

@Injectable()
export class BooleanDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "boolean";

  generate(_field: EntitySchemaField, context: DemoValueContext) {
    return context.faker.datatype.boolean();
  }
}

@Injectable()
export class NumberDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "number";

  generate(field: EntitySchemaField, context: DemoValueContext) {
    return context.faker.number.int(
      boundsOf(
        context,
        field,
        { min: ["min"], max: ["max"] },
        { min: 0, max: 100 },
      ),
    );
  }
}

@Injectable()
export class PercentageDemoValueGenerator extends NumberDemoValueGenerator {
  override readonly dataType: string = "percentage";
}

@Injectable()
export class StringDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "string";

  generate(_field: EntitySchemaField, context: DemoValueContext) {
    return context.faker.lorem.words({ min: 1, max: 3 });
  }
}

@Injectable()
export class LongTextDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "long-text";

  generate(_field: EntitySchemaField, context: DemoValueContext) {
    return context.faker.lorem.sentences({ min: 1, max: 3 });
  }
}

@Injectable()
export class EmailDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "email";

  generate(_field: EntitySchemaField, context: DemoValueContext) {
    return context.faker.internet.email();
  }
}

@Injectable()
export class UrlDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "url";

  generate(_field: EntitySchemaField, context: DemoValueContext) {
    return context.faker.internet.url();
  }
}

/** One object of the shape a schema-embed field declares in `additional`. */
function buildEmbedded(
  field: EntitySchemaField,
  context: DemoValueContext,
): Record<string, unknown> | undefined {
  const innerSchema = field.additional as
    SchemaEmbedDatatypeAdditional | undefined;
  if (!innerSchema || typeof innerSchema !== "object") {
    return undefined;
  }

  const embedded: Record<string, unknown> = {};
  for (const [id, innerField] of Object.entries(innerSchema)) {
    const value = context.generateValue({ ...innerField, id });
    if (value !== undefined) {
      embedded[id] = value;
    }
  }
  return Object.keys(embedded).length ? embedded : undefined;
}

@Injectable()
export class SchemaEmbedDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "schema-embed";

  generate(field: EntitySchemaField, context: DemoValueContext) {
    return buildEmbedded(field, context);
  }
}

/**
 * The same shape for a field holding a list of them: the datatype forces `isArray`,
 * so the engine already repeats this into the entries of the table.
 */
@Injectable()
export class SchemaEmbedArrayDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "schema-embed-array";

  generate(field: EntitySchemaField, context: DemoValueContext) {
    return buildEmbedded(field, context);
  }
}
