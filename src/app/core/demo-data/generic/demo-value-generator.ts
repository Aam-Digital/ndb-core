import { InjectionToken } from "@angular/core";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { faker } from "../faker";

/** What a generator needs to fill one field. Built fresh for each field. */
export interface DemoValueContext {
  readonly faker: typeof faker;

  /** ids of the other fields of the same record, to tell e.g. a full name from a surname */
  readonly siblingFields: readonly string[];

  /** the field's remaining scenario-spec keys, e.g. `{ min: 18, max: 99 }` */
  readonly options: Record<string, unknown>;

  /** fill a nested field, used by the embedded-object datatypes */
  generateValue(field: EntitySchemaField): unknown;
}

/** Invents a plausible demo value for the fields of one datatype. */
export interface DemoValueGenerator {
  readonly dataType: string;

  /** Return `undefined` to leave the field empty. */
  generate(field: EntitySchemaField, context: DemoValueContext): unknown;
}

/**
 * Teach the demo data engine about a datatype by registering a generator next to
 * the datatype itself:
 * `{ provide: DEMO_VALUE_GENERATOR, useClass: MyDemoValueGenerator, multi: true }`
 */
export const DEMO_VALUE_GENERATOR = new InjectionToken<DemoValueGenerator[]>(
  "DEMO_VALUE_GENERATOR",
);
