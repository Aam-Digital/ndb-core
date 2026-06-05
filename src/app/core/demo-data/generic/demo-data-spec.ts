/**
 * Per-field overrides for the demo data spec.
 * All fields are optional; at most one of valuePool/valuePoolRef may be used.
 */
export interface DemoFieldSpec {
  /**
   * Inline array of values to sample uniformly.
   * For multi-field entries (e.g. note stories) each element may be an object
   * whose keys are field names — the generator will Object.assign() the chosen
   * entry onto the entity.
   */
  valuePool?: any[];

  /**
   * Named pool from the active-language pool file (demo-data.<lang>.json).
   * Resolved at generation time via the ValuePoolLoader.
   */
  valuePoolRef?: string;

  /**
   * Probability (0–1) that this field is left empty.
   * Ignored for required fields (required validator always wins).
   */
  nullProbability?: number;
}

/**
 * Per-entity-type spec.
 */
export interface DemoEntitySpec {
  /**
   * Number of entities to generate.
   * Mutually exclusive with `perParent`.
   */
  count?: number;

  /**
   * Generate entities as children of another type.
   * E.g. `{ type: "Child", min: 2, max: 6 }` creates 2–6 entities per Child.
   * Not yet supported by the engine – reserved for future use.
   */
  perParent?: { type: string; min: number; max: number };

  /** Per-field overrides, keyed by field id. */
  fields?: Record<string, DemoFieldSpec>;
}

/**
 * Root type of a demo-data spec.
 * Keyed by entity type name (e.g. "Child", "School").
 *
 * Stored under the `demoData` key in the active `Config:CONFIG_ENTITY` document
 * so the engine reads it via `ConfigService.getConfig<DemoDataSpec>("demoData")`.
 */
export type DemoDataSpec = Record<string, DemoEntitySpec>;
