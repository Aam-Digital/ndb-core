import { inject, Injectable } from "@angular/core";
import {
  DEMO_VALUE_GENERATOR,
  DemoValueContext,
  DemoValueGenerator,
} from "./demo-value-generator";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

/**
 * Aggregates all registered `DemoValueGenerator` contributors and dispatches
 * value generation by `dataType`.
 *
 * Core generators are registered in `DemoDataModule`.
 * Feature/plugin modules can contribute their own generator:
 * `{ provide: DEMO_VALUE_GENERATOR, useClass: MyGenerator, multi: true }`
 */
@Injectable()
export class DemoValueService {
  private readonly generatorsByType: Map<string, DemoValueGenerator>;

  constructor() {
    const generators =
      inject(DEMO_VALUE_GENERATOR, { optional: true }) ?? [];
    this.generatorsByType = new Map(generators.map((g) => [g.dataType, g]));
  }

  /**
   * Generate a demo value for the given schema field.
   * Returns `undefined` when no generator is registered for the field's dataType.
   */
  generate(field: EntitySchemaField, ctx: DemoValueContext): any {
    return this.generatorsByType.get(field.dataType)?.generate(field, ctx);
  }
}
