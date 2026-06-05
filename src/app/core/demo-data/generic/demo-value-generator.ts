import { InjectionToken } from "@angular/core";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { Entity } from "../../entity/model/entity";
import { faker } from "../faker";

/**
 * Shared context passed to every demo value generator.
 * Carries all dependencies generators may need without requiring individual DI.
 */
export interface DemoValueContext {
  /** Seeded faker instance for reproducible random data */
  faker: typeof faker;
  /** All entities generated so far, keyed by entity type (populated after Pass 1) */
  entityStore: Map<string, Entity[]>;
  /**
   * Fill a sub-field value using the full engine resolution order.
   * Used by schema-embed to recursively fill embedded object fields.
   * Guards against infinite recursion via a depth counter.
   */
  generateValue(field: EntitySchemaField, depth?: number): any;
}

/**
 * Generates a demo value for a specific dataType.
 *
 * Implement this interface and register as a multi-provider under `DEMO_VALUE_GENERATOR`
 * to contribute demo value generation for a datatype:
 * `{ provide: DEMO_VALUE_GENERATOR, useClass: MyDemoValueGenerator, multi: true }`
 */
export interface DemoValueGenerator {
  /** The dataType string this generator handles */
  readonly dataType: string;

  /**
   * Generate a demo value for the given field.
   * Return `undefined` to leave the field empty.
   */
  generate(field: EntitySchemaField, ctx: DemoValueContext): any;
}

/**
 * DI token for contributing per-datatype demo value generators.
 * Register your generator as a multi-provider to extend demo value generation
 * for a custom or feature datatype without modifying any central class.
 */
export const DEMO_VALUE_GENERATOR = new InjectionToken<DemoValueGenerator[]>(
  "DEMO_VALUE_GENERATOR",
);
