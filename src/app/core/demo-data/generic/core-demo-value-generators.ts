import { inject, Injectable } from "@angular/core";
import { DemoValueContext, DemoValueGenerator } from "./demo-value-generator";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
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

@Injectable()
export class ConfigurableEnumDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = "configurable-enum";

  private readonly enums = inject(ConfigurableEnumService);

  generate(field: EntitySchemaField, context: DemoValueContext) {
    const values = this.enums.getEnumValues(field.additional);
    // a spec can narrow the options, e.g. to the genders a use case records
    const ids = context.options.ids;
    const allowed = Array.isArray(ids)
      ? values.filter((value) => ids.includes(value.id))
      : values;
    // an option without a label is a placeholder in the config, not a real choice
    const labelled = allowed.filter((value) => !!value.label);
    const narrowed = allowed.length ? allowed : values;
    const options = labelled.length ? labelled : narrowed;

    return options.length
      ? context.faker.helpers.arrayElement(options)
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
        min: numberOption(context, field, "min", "minAge") ?? 5,
        max: numberOption(context, field, "max", "maxAge") ?? 50,
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
    return context.faker.number.int({
      min: numberOption(context, field, "min") ?? 0,
      max: numberOption(context, field, "max") ?? 100,
    });
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
