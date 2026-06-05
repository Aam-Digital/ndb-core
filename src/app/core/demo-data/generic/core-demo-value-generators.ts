import { inject, Injectable } from "@angular/core";
import { DemoValueContext, DemoValueGenerator } from "./demo-value-generator";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { DateWithAge } from "../../basic-datatypes/date-with-age/dateWithAge";
import { SchemaEmbedDatatypeAdditional } from "../../basic-datatypes/schema-embed/schema-embed.datatype";

@Injectable()
export class ConfigurableEnumDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "configurable-enum";
  private readonly enumService = inject(ConfigurableEnumService);

  generate(field: EntitySchemaField, ctx: DemoValueContext): any {
    const values = this.enumService.getEnumValues(field.additional);
    if (!values.length) return undefined;
    return ctx.faker.helpers.arrayElement(values);
  }
}

@Injectable()
export class DateDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "date";

  generate(_field: EntitySchemaField, ctx: DemoValueContext): Date {
    return ctx.faker.date.past({ years: 2 });
  }
}

@Injectable()
export class DateOnlyDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "date-only";

  generate(_field: EntitySchemaField, ctx: DemoValueContext): Date {
    return ctx.faker.date.past({ years: 2 });
  }
}

@Injectable()
export class DateWithAgeDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "date-with-age";

  generate(_field: EntitySchemaField, ctx: DemoValueContext): DateWithAge {
    return new DateWithAge(
      ctx.faker.date.birthdate({ mode: "age", min: 5, max: 50 }),
    );
  }
}

@Injectable()
export class MonthDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "month";

  generate(_field: EntitySchemaField, ctx: DemoValueContext): Date {
    const d = ctx.faker.date.past({ years: 2 });
    // month fields store only year+month; zero out day
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
}

@Injectable()
export class BooleanDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "boolean";

  generate(_field: EntitySchemaField, ctx: DemoValueContext): boolean {
    return ctx.faker.datatype.boolean();
  }
}

@Injectable()
export class StringDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "string";

  generate(_field: EntitySchemaField, ctx: DemoValueContext): string {
    return ctx.faker.word.noun();
  }
}

@Injectable()
export class NumberDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "number";

  generate(field: EntitySchemaField, ctx: DemoValueContext): number {
    const min = field.validators?.min ?? 0;
    const max = field.validators?.max ?? 100;
    return ctx.faker.number.int({ min, max });
  }
}

@Injectable()
export class SchemaEmbedDemoValueGenerator implements DemoValueGenerator {
  readonly dataType = "schema-embed";

  generate(field: EntitySchemaField, ctx: DemoValueContext): any {
    const additionalSchema =
      field.additional as SchemaEmbedDatatypeAdditional | undefined;
    if (!additionalSchema) return undefined;

    const result: Record<string, any> = {};
    for (const [subFieldId, subField] of Object.entries(additionalSchema)) {
      // ctx.generateValue tracks recursion depth internally to guard against cycles
      const filledSubField: EntitySchemaField = { id: subFieldId, ...subField };
      result[subFieldId] = ctx.generateValue(filledSubField);
    }
    return result;
  }
}
