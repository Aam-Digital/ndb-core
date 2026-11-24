/** Tuning for one field of an entity type in a scenario's demo data spec. */
export interface DemoFieldSpec {
  /** values to sample from, instead of inventing one */
  valuePool?: unknown[];

  /**
   * Path of a faker method to call, e.g. `person.fullName` or `company.name`,
   * for fields whose meaning neither the datatype nor the field name reveals.
   */
  faker?: string;

  /** Arguments for the `faker` method, e.g. `[5]` for `string.numeric`. */
  fakerArgs?: unknown[];

  /**
   * Id of a date field this one must not precede, e.g. a dropout date
   * `after` the admission date.
   */
  after?: string;

  /** chance (0-1) to leave the field empty; ignored for required fields */
  nullProbability?: number;

  /** any other key is passed to the datatype's generator, e.g. `min` / `max` */
  [option: string]: unknown;
}

/** Tuning for one entity type. */
export interface DemoEntitySpec {
  /** how many records to generate; 0 to generate none */
  count?: number;

  /**
   * Hand-written sample records to draw from, each setting several fields at
   * once (e.g. a note story of category, subject and text). One is picked per
   * record; the fields it does not mention are generated as usual.
   */
  samples?: Record<string, unknown>[];

  fields?: Record<string, DemoFieldSpec>;
}

/**
 * A scenario's demo data spec, keyed by entity type.
 * Stored as the `Config:DemoData` document, imported with the base config.
 */
export type DemoDataSpec = Record<string, DemoEntitySpec>;

export const DEMO_DATA_CONFIG_ID = "DemoData";

/** Records per entity type when the spec says nothing about it. */
export const DEFAULT_RECORD_COUNT = 15;
