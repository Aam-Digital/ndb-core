import { inject, Injectable } from "@angular/core";
import {
  DEMO_VALUE_GENERATOR,
  DemoValueContext,
  DemoValueGenerator,
} from "./demo-value-generator";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

/** Routes a field to the demo value generator registered for its datatype. */
@Injectable()
export class DemoValueService {
  private readonly generators = new Map<string, DemoValueGenerator>(
    (inject(DEMO_VALUE_GENERATOR, { optional: true }) ?? []).map(
      (generator) => [generator.dataType, generator],
    ),
  );

  /** `undefined` for a datatype without a generator, so that field stays empty. */
  generate(field: EntitySchemaField, context: DemoValueContext): unknown {
    return this.generators.get(field.dataType)?.generate(field, context);
  }
}
