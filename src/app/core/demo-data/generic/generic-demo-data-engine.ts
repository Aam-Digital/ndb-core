import { inject, Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data-generator";
import { Entity } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { DemoValueService } from "./demo-value.service";
import { DemoEntityStore } from "./demo-entity-store";
import { DemoDataSpec, DemoEntitySpec, DemoFieldSpec } from "./demo-data-spec";
import { ValuePoolLoader } from "./value-pool-loader";
import { DemoValueContext } from "./demo-value-generator";
import { faker } from "../faker";
import { createEntityOfType } from "../create-entity-of-type";
import { ConfigService } from "../../config/config.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

/** Max depth to prevent infinite recursion on schema-embed fields */
const MAX_EMBED_DEPTH = 4;

/**
 * Name heuristics table (checked against lower-cased field id and label).
 * First matching rule wins.
 */
const NAME_HEURISTICS: Array<{
  test: (id: string, label: string) => boolean;
  generate: (ctx: DemoValueContext) => any;
}> = [
  {
    test: (id) => id === "firstname" || id === "first_name",
    generate: (ctx) => ctx.faker.person.firstName(),
  },
  {
    test: (id, label) =>
      id === "name" ||
      id === "lastname" ||
      id === "last_name" ||
      id === "surname" ||
      label === "name" ||
      label === "lastname" ||
      label === "surname",
    generate: (ctx) => ctx.faker.person.lastName(),
  },
  {
    test: (id) => id.includes("phone"),
    generate: (ctx) => ctx.faker.phone.number(),
  },
];

/**
 * Generic, schema-driven demo data generator.
 *
 * Reads entity schemas and a `demoData` spec from the active config, then:
 * - Pass 1 (`generateEntities`): creates all schema-driven entities and stores
 *   them in `DemoEntityStore` for retained generators to read.
 * - Pass 2 (`linkEntityReferences`): fills `entity`-datatype fields by sampling
 *   the completed store. Called by `DemoDataService` after all generators run.
 */
@Injectable()
export class GenericDemoDataEngine extends DemoDataGenerator<Entity> {
  private readonly demoValueService = inject(DemoValueService);
  private readonly entityStore = inject(DemoEntityStore);
  private readonly configService = inject(ConfigService);
  private readonly valuePoolLoader = inject(ValuePoolLoader);

  protected override generateEntities(): Entity[] {
    const spec =
      this.configService.getConfig<DemoDataSpec>("demoData") ?? {};

    const result: Entity[] = [];

    // Stable alphabetical order for determinism with the seeded faker
    const entityTypes = this.entityRegistry
      .getEntityTypes(true)
      .sort((a, b) => a.key.localeCompare(b.key));

    // Pass 1a: fixed-count entity types
    for (const { key, value } of entityTypes) {
      const typeSpec = spec[key];
      if (!typeSpec?.count) continue;

      const entities = Array.from({ length: typeSpec.count }, () =>
        this.buildEntity(key, value.schema, typeSpec),
      );
      this.entityStore.set(key, entities);
      result.push(...entities);
    }

    // Pass 1b: perParent entity types (one batch per parent entity)
    for (const { key, value } of entityTypes) {
      const typeSpec = spec[key];
      if (!typeSpec?.perParent) continue;

      const { type: parentType, min, max } = typeSpec.perParent;
      const parents = this.entityStore.get(parentType);
      if (!parents.length) continue;

      const entities: Entity[] = [];
      for (const parent of parents) {
        const count = faker.number.int({ min, max });
        for (let i = 0; i < count; i++) {
          entities.push(this.buildEntity(key, value.schema, typeSpec));
        }
      }
      this.entityStore.set(key, entities);
      result.push(...entities);
    }

    return result;
  }

  private buildEntity(
    entityType: string,
    schema: Map<string, EntitySchemaField>,
    typeSpec: DemoEntitySpec,
  ): Entity {
    const entity = createEntityOfType(entityType);
    const ctx = this.makeContext(entity);

    for (const [fieldId, field] of schema.entries()) {
      if (field.isInternalField) continue;
      // Entity-reference fields are filled in Pass 2
      if (field.dataType === "entity") continue;

      const schemaFieldWithId: EntitySchemaField = { id: fieldId, ...field };
      let value = this.fillField(schemaFieldWithId, typeSpec, ctx);
      if (value === undefined) continue;

      if (field.isArray) {
        // Generate 1–3 elements; wrap the already-generated first value
        const count = faker.number.int({ min: 1, max: 3 });
        const arr = [value];
        for (let i = 1; i < count; i++) {
          const extra = this.fillField(schemaFieldWithId, typeSpec, ctx);
          if (extra !== undefined) arr.push(extra);
        }
        entity[fieldId] = arr;
      } else {
        entity[fieldId] = value;
      }
    }

    return entity;
  }

  private fillField(
    field: EntitySchemaField,
    typeSpec: DemoEntitySpec,
    ctx: DemoValueContext,
    embedDepth = 0,
  ): any {
    const fieldId = field.id!;
    const fieldSpec: DemoFieldSpec | undefined = typeSpec.fields?.[fieldId];

    // 1. Spec per-field override
    if (fieldSpec?.valuePool?.length) {
      const raw = ctx.faker.helpers.arrayElement(fieldSpec.valuePool);
      return this.applyNullProbability(raw, field, fieldSpec);
    }
    if (fieldSpec?.valuePoolRef) {
      const pool = this.valuePoolLoader.getPool(fieldSpec.valuePoolRef);
      if (pool.length) {
        const raw = ctx.faker.helpers.arrayElement(pool);
        return this.applyNullProbability(raw, field, fieldSpec);
      }
      // Pool not found — fall through to heuristics/datatype
    }

    // 2. Respect defaultValue — leave empty so app default-value logic applies
    if (field.defaultValue) return undefined;

    // 3. Name/label heuristic
    const idLower = fieldId.toLowerCase();
    const labelLower = (field.label ?? "").toLowerCase();
    for (const h of NAME_HEURISTICS) {
      if (h.test(idLower, labelLower)) {
        return this.applyNullProbability(h.generate(ctx), field, fieldSpec);
      }
    }

    // 4. Datatype strategy (schema-embed recurses via ctx.generateValue)
    const value = this.demoValueService.generate(field, ctx);

    // 5. Required validator: force a fallback if still empty
    const required = (field.validators as any)?.required;
    if (value === undefined && required) {
      return String(ctx.faker.word.noun());
    }

    return this.applyNullProbability(value, field, fieldSpec);
  }

  private applyNullProbability(
    value: any,
    field: EntitySchemaField,
    fieldSpec?: DemoFieldSpec,
  ): any {
    const prob = fieldSpec?.nullProbability ?? 0;
    if (prob > 0 && !(field.validators as any)?.required) {
      if (faker.number.float() < prob) return undefined;
    }
    return value;
  }

  private makeContext(entity: Entity): DemoValueContext {
    const ctx: DemoValueContext = {
      faker,
      entityStore: this.entityStore.asMap(),
      generateValue: (field: EntitySchemaField, depth = 0) => {
        if (depth >= MAX_EMBED_DEPTH) return undefined;
        // For schema-embed sub-fields, typeSpec fields overrides are not applied
        return this.fillField(field, {}, ctx, depth);
      },
    };
    return ctx;
  }

  /**
   * Pass 2: fill entity-reference fields for all engine-generated entities.
   * Must be called by `DemoDataService` AFTER all generators have produced entities.
   */
  linkEntityReferences(): void {
    for (const [entityType, entities] of this.entityStore.entries()) {
      let constructor: any;
      try {
        constructor = this.entityRegistry.get(entityType);
      } catch {
        continue;
      }
      if (!constructor?.schema) continue;

      for (const entity of entities) {
        for (const [fieldId, field] of (
          constructor.schema as Map<string, EntitySchemaField>
        ).entries()) {
          if (field.dataType !== "entity" || field.isInternalField) continue;

          const targetType = this.resolveEntityTargetType(field);
          if (!targetType) continue;

          const targets = this.entityStore.get(targetType);
          if (!targets.length) continue;

          if (field.isArray) {
            const count = faker.number.int({ min: 1, max: 3 });
            entity[fieldId] = faker.helpers
              .arrayElements(targets, count)
              .map((t) => t.getId());
          } else {
            entity[fieldId] = faker.helpers.arrayElement(targets).getId();
          }
        }
      }
    }
  }

  /**
   * Extract the target entity type name from a field's `additional`.
   * Returns `undefined` when the type cannot be determined.
   */
  private resolveEntityTargetType(field: EntitySchemaField): string | undefined {
    const additional = field.additional;
    if (!additional) return undefined;
    if (typeof additional === "string") return additional;
    // Object form (EntityAdditional with refField) — used for import mapping;
    // target type is not a simple lookup, skip for now.
    return undefined;
  }
}
