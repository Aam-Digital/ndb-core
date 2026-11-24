import { inject, Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data-generator";
import { Entity } from "../../entity/model/entity";
import { EntitySchema } from "../../entity/schema/entity-schema";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { Config } from "../../config/config";
import { ConfigService } from "../../config/config.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { resolveLocaleConfig } from "../../language/active-locale";
import { Logging } from "../../logging/logging.service";
import { asArray } from "../../../utils/asArray";
import { faker } from "../faker";
import { createEntityOfType } from "../create-entity-of-type";
import { DemoValueService } from "./demo-value.service";
import { DemoEntityStore } from "./demo-entity-store";
import { DemoValueContext } from "./demo-value-generator";
import { generateByFieldName } from "./demo-name-heuristics";
import {
  DEFAULT_RECORD_COUNT,
  DEMO_DATA_CONFIG_ID,
  DemoDataSpec,
  DemoEntitySpec,
  DemoFieldSpec,
} from "./demo-data-spec";

const ENTITY_CONFIG_PREFIX = "entity:";
const MAX_EMBED_DEPTH = 3;
const MAX_ARRAY_VALUES = 3;

/** Datatypes whose values read as text, so a field name can say more than its type. */
const TEXT_DATATYPES = ["string", "long-text"];

/** What the name of a field holding the end of a period looks like, and its start. */
const START_COUNTERPARTS: [RegExp, string][] = [
  [/^end$/i, "start"],
  [/End$/, "Start"],
  [/^End/, "Start"],
  [/_end$/i, "_start"],
  [/^end_/i, "start_"],
  [/^to$/i, "from"],
];

/**
 * The field an end date belongs to, guessed from its name (`dateEnd` -> `dateStart`).
 * Each field is generated on its own, so a use case that does not spell the pair out
 * in its spec would otherwise get records ending before they start.
 */
function startFieldOf(
  fieldId: string,
  siblingFields: readonly string[],
): string | undefined {
  for (const [pattern, replacement] of START_COUNTERPARTS) {
    if (!pattern.test(fieldId)) {
      continue;
    }
    const counterpart = fieldId.replace(pattern, replacement).toLowerCase();
    const match = siblingFields.find((id) => id.toLowerCase() === counterpart);
    if (match) {
      return match;
    }
  }
  return undefined;
}

let reservedFields: Set<string> | undefined;

/**
 * Fields the framework owns - a config may re-declare them as ordinary attributes,
 * but writing one would overwrite a record identity or archive the record.
 * Read from the base schema, so this follows whatever Entity marks as internal.
 */
function isReservedField(fieldId: string): boolean {
  reservedFields ??= new Set(
    Array.from(Entity.schema)
      .filter(([, field]) => field.isInternalField)
      .map(([id]) => id),
  );
  return reservedFields.has(fieldId);
}

/** Everything the fill of one field depends on besides the field itself. */
interface FieldFill {
  /** id of the field being filled */
  fieldId: string;
  spec?: DemoFieldSpec;
  /** how far inside embedded objects this field sits, to stop endless recursion */
  depth: number;
  /** ids of the other fields of the same record */
  siblings: readonly string[];
}

/**
 * Generates demo records for every entity type a use case configures, from the type's
 * schema and the scenario's optional `Config:DemoData` spec.
 *
 * Runs in two passes, because references can only point at records that exist:
 * {@link generateEntities} creates the records and fills their plain fields,
 * {@link linkReferences} then connects them.
 */
@Injectable()
export class GenericDemoDataEngine extends DemoDataGenerator<Entity> {
  private readonly demoValues = inject(DemoValueService);
  private readonly store = inject(DemoEntityStore);
  private readonly configService = inject(ConfigService);
  private readonly entityMapper = inject(EntityMapperService);

  private spec: DemoDataSpec = {};
  private typesOfOtherGenerators = new Set<string>();

  /** Load the scenario's spec before generation starts. */
  async init(typesOfOtherGenerators: string[] = []): Promise<void> {
    this.typesOfOtherGenerators = new Set(typesOfOtherGenerators);
    this.spec = await this.loadSpec();
  }

  private async loadSpec(): Promise<DemoDataSpec> {
    try {
      const config = await this.entityMapper.load(Config, DEMO_DATA_CONFIG_ID);
      return resolveLocaleConfig((config.data ?? {}) as DemoDataSpec);
    } catch (error) {
      // a use case without a spec is normal: every type falls back to defaults
      Logging.debug("No demo data spec configured", error);
      return {};
    }
  }

  protected generateEntities(): Entity[] {
    this.store.clear();
    const generated: Entity[] = [];

    for (const entityType of this.entityTypesToGenerate()) {
      const typeSpec = this.spec[entityType] ?? {};
      const schema = this.entityRegistry.get(entityType).schema;

      const entities = Array.from(
        { length: typeSpec.count ?? DEFAULT_RECORD_COUNT },
        () => {
          const entity = createEntityOfType(entityType);
          this.fillFields(entity, schema, typeSpec);
          return entity;
        },
      );

      this.store.set(entityType, entities);
      generated.push(...entities);
    }

    return generated;
  }

  /**
   * Every type the use case declares, plus any the spec adds.
   *
   * Deliberately not `getEntityTypes(true)`: that requires a label and would skip
   * the join types (e.g. linking participants to events) that make lists show
   * related records. Sorted, so the seeded faker produces stable data.
   */
  private entityTypesToGenerate(): string[] {
    const declaredInConfig = this.configService
      .getAllConfigs<{ _id: string }>(ENTITY_CONFIG_PREFIX)
      .map(({ _id }) => _id.substring(ENTITY_CONFIG_PREFIX.length));

    return Array.from(new Set([...declaredInConfig, ...Object.keys(this.spec)]))
      .filter((type) => !this.typesOfOtherGenerators.has(type))
      .filter(
        (type) =>
          this.entityRegistry.has(type) &&
          !this.entityRegistry.get(type).isInternalEntity,
      )
      .sort();
  }

  /**
   * Fill the fields a generator of its own left empty, so its records carry
   * everything else the use case configured on that type.
   */
  fillRemainingFields(entity: Entity, entityType: string): void {
    if (!this.entityRegistry.has(entityType)) {
      return;
    }
    this.fillFields(
      entity,
      this.entityRegistry.get(entityType).schema,
      this.spec[entityType] ?? {},
    );
  }

  private fillFields(
    entity: Entity,
    schema: EntitySchema,
    typeSpec: DemoEntitySpec,
  ): void {
    const siblings = Array.from(schema.keys());
    this.applySample(entity, schema, typeSpec, siblings);

    for (const [fieldId, field] of schema) {
      // references are filled in the second pass, once all types have records
      const skip =
        field.isInternalField ||
        isReservedField(fieldId) ||
        field.dataType === "entity" ||
        entity[fieldId] !== undefined;
      if (skip) {
        continue;
      }

      const withId = { ...field, id: fieldId };
      const fill: FieldFill = {
        fieldId,
        spec: typeSpec.fields?.[fieldId],
        depth: 0,
        siblings,
      };
      const value = this.notBefore(this.fillField(withId, fill), entity, fill);
      if (value !== undefined) {
        entity[fieldId] = value;
      }
    }
  }

  /**
   * Assign one of the hand-written samples of this type, which set several fields
   * together (a note sets its category, subject and text as one story).
   */
  private applySample(
    entity: Entity,
    schema: EntitySchema,
    typeSpec: DemoEntitySpec,
    siblings: readonly string[],
  ): void {
    if (!typeSpec.samples?.length) {
      return;
    }

    const sample = faker.helpers.arrayElement(typeSpec.samples);
    for (const [fieldId, raw] of Object.entries(sample ?? {})) {
      const field = schema.get(fieldId);
      if (!field || entity[fieldId] !== undefined) {
        continue;
      }
      entity[fieldId] = this.toStoredValue({ ...field, id: fieldId }, raw, {
        fieldId,
        depth: 0,
        siblings,
      });
    }
  }

  private fillField(field: EntitySchemaField, fill: FieldFill): unknown {
    const required = field.validators?.required === true;
    if (!required && this.leaveEmpty(fill.spec)) {
      return undefined;
    }

    const value = field.isArray
      ? this.generateArray(field, fill)
      : this.generateValue(field, fill);

    if (value === undefined && required && this.isTextField(field)) {
      // only text can be invented safely: another datatype would get a value its view cannot read
      return faker.lorem.word();
    }
    return value;
  }

  /**
   * Keep a date at or after the one of the field it belongs with, named by the
   * spec key `after` or guessed from both names.
   */
  private notBefore(value: unknown, entity: Entity, fill: FieldFill): unknown {
    const afterField =
      fill.spec?.after ?? startFieldOf(fill.fieldId, fill.siblings);
    if (typeof afterField !== "string" || !(value instanceof Date)) {
      return value;
    }

    const lowerBound = entity[afterField];
    if (!(lowerBound instanceof Date) || value >= lowerBound) {
      return value;
    }

    const today = faker.defaultRefDate();
    return lowerBound >= today
      ? lowerBound
      : faker.date.between({ from: lowerBound, to: today });
  }

  private leaveEmpty(fieldSpec: DemoFieldSpec | undefined): boolean {
    const probability = fieldSpec?.nullProbability ?? 0;
    return probability > 0 && faker.number.float() < probability;
  }

  private generateValue(field: EntitySchemaField, fill: FieldFill): unknown {
    if (fill.spec?.valuePool?.length) {
      const pooled = faker.helpers.arrayElement(fill.spec.valuePool);
      return this.toStoredValue(field, pooled, fill);
    }
    if (fill.spec?.faker) {
      return this.fromFakerPath(fill.spec.faker, fill.spec.fakerArgs);
    }

    // A default value is only applied to a record in a form, never to a generated one,
    // so leaving these empty would leave required fields empty. A fixed default is
    // what the app would set, anything else (now, current user, inherited) is invented.
    const fixedDefault =
      field.defaultValue?.mode === "static"
        ? field.defaultValue.config?.value
        : undefined;
    if (fixedDefault !== undefined && field.dataType !== "configurable-enum") {
      return fixedDefault;
    }

    const context = this.contextFor(fill);
    const byName = this.isTextField(field)
      ? generateByFieldName(field.id, field.label, context)
      : undefined;

    return byName ?? this.demoValues.generate(field, context);
  }

  private generateArray(
    field: EntitySchemaField,
    fill: FieldFill,
  ): unknown[] | undefined {
    const values: unknown[] = [];
    const count = faker.number.int({ min: 1, max: MAX_ARRAY_VALUES });

    for (let i = 0; i < count; i++) {
      const value = this.generateValue(field, fill);
      if (value !== undefined && !values.includes(value)) {
        values.push(value);
      }
    }

    return values.length ? values : undefined;
  }

  /**
   * A value the spec states, in the format the field stores it in:
   * a dropdown keeps whole options, so a stated id is resolved to one.
   */
  private toStoredValue(
    field: EntitySchemaField,
    raw: unknown,
    fill: FieldFill,
  ): unknown {
    if (field.dataType !== "configurable-enum" || typeof raw !== "string") {
      return raw;
    }

    const asOption = this.demoValues.generate(
      field,
      this.contextFor({ ...fill, spec: { ids: [raw] } }),
    );
    return asOption ?? raw;
  }

  /**
   * Call a faker method the spec names by path, e.g. `person.fullName`,
   * for the fields whose meaning neither the datatype nor the name reveals.
   */
  private fromFakerPath(path: unknown, args: unknown): unknown {
    if (typeof path !== "string") {
      return undefined;
    }

    const keys = path.split(".");
    const method = keys.pop();
    const module = keys.reduce<any>((parent, key) => parent?.[key], faker);
    if (typeof module?.[method] !== "function") {
      // a spec can come from a partner or an LLM: their typo is not our bug
      Logging.debug("Unknown faker path in the demo data spec", { path });
      return undefined;
    }

    return module[method](...(Array.isArray(args) ? args : []));
  }

  private contextFor(fill: FieldFill): DemoValueContext {
    const { valuePool, nullProbability, ...options } = fill.spec ?? {};

    return {
      faker,
      options,
      siblingFields: fill.siblings,
      generateValue: (innerField) =>
        fill.depth >= MAX_EMBED_DEPTH
          ? undefined
          : this.fillField(innerField, {
              fieldId: innerField.id,
              depth: fill.depth + 1,
              siblings: [],
            }),
    };
  }

  private isTextField(field: EntitySchemaField): boolean {
    return TEXT_DATATYPES.includes(field.dataType);
  }

  /** Call once every generator has produced its records. */
  linkReferences(): void {
    for (const [entityType, entities] of this.store.entries()) {
      const referenceFields = Array.from(
        this.entityRegistry.get(entityType).schema,
      ).filter(
        ([id, field]) =>
          field.dataType === "entity" &&
          !field.isInternalField &&
          !isReservedField(id),
      );

      for (const entity of entities) {
        for (const [fieldId, field] of referenceFields) {
          if (entity[fieldId] !== undefined) {
            // a generator of its own already said what this record relates to
            continue;
          }

          // a record is not its own sibling or parent
          const candidates = this.linkCandidates(field).filter(
            (candidate) => candidate !== entity,
          );
          if (candidates.length === 0) {
            continue;
          }

          entity[fieldId] = field.isArray
            ? faker.helpers
                .arrayElements(candidates, { min: 1, max: MAX_ARRAY_VALUES })
                .map((candidate) => candidate.getId())
            : faker.helpers.arrayElement(candidates).getId();
        }
      }
    }
  }

  private linkCandidates(field: EntitySchemaField): Entity[] {
    return asArray(field.additional)
      .filter((type): type is string => typeof type === "string")
      .flatMap((type) => this.store.get(type));
  }
}
