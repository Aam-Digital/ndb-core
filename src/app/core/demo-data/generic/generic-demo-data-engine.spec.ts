import { TestBed } from "@angular/core/testing";
import { GenericDemoDataEngine } from "./generic-demo-data-engine";
import { DemoValueService } from "./demo-value.service";
import { DemoEntityStore } from "./demo-entity-store";
import { DEMO_VALUE_GENERATOR } from "./demo-value-generator";
import {
  ConfigurableEnumDemoValueGenerator,
  DateOnlyDemoValueGenerator,
  DateWithAgeDemoValueGenerator,
  StringDemoValueGenerator,
} from "./core-demo-value-generators";
import { ConfigService } from "../../config/config.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { Entity } from "../../entity/model/entity";
import { DemoDataSpec } from "./demo-data-spec";

/** The entity types a use case declares, as the engine reads them from the config. */
function declareTypes(types: Record<string, Record<string, any>>) {
  const registry = TestBed.inject(EntityRegistry);
  for (const [type, attributes] of Object.entries(types)) {
    class Declared extends Entity {
      static override readonly ENTITY_TYPE = type;
      static override readonly schema = new Map(Object.entries(attributes));
    }
    registry.set(type, Declared);
  }
  return Object.keys(types).map((type) => ({ _id: `entity:${type}` }));
}

/** A record of a type declared above, as a generator of its own would create it. */
function TestEntityOfType(type: string): Entity {
  const ctor = TestBed.inject(EntityRegistry).get(type);
  return new ctor();
}

describe("GenericDemoDataEngine", () => {
  let engine: GenericDemoDataEngine;
  let entityConfigs: { _id: string }[] = [];
  let spec: DemoDataSpec;

  /** Run generation and return the records of one type. */
  async function generate(type: string): Promise<Entity[]> {
    await engine.init();
    engine["generateEntities"]();
    return TestBed.inject(DemoEntityStore).get(type);
  }

  beforeEach(() => {
    entityConfigs = [];
    spec = {};

    TestBed.configureTestingModule({
      providers: [
        GenericDemoDataEngine,
        DemoValueService,
        DemoEntityStore,
        EntityRegistry,
        {
          provide: DEMO_VALUE_GENERATOR,
          useClass: StringDemoValueGenerator,
          multi: true,
        },
        {
          provide: DEMO_VALUE_GENERATOR,
          useClass: DateOnlyDemoValueGenerator,
          multi: true,
        },
        {
          provide: DEMO_VALUE_GENERATOR,
          useClass: DateWithAgeDemoValueGenerator,
          multi: true,
        },
        {
          provide: DEMO_VALUE_GENERATOR,
          useClass: ConfigurableEnumDemoValueGenerator,
          multi: true,
        },
        {
          provide: ConfigService,
          useValue: { getAllConfigs: () => entityConfigs },
        },
        {
          provide: EntityMapperService,
          useValue: { load: () => Promise.resolve({ data: spec }) },
        },
        {
          provide: ConfigurableEnumService,
          useValue: {
            getEnumValues: () => [
              { id: "A", label: "A" },
              { id: "B", label: "B" },
            ],
          },
        },
      ],
    });
    engine = TestBed.inject(GenericDemoDataEngine);
  });

  it("generates the configured number of records for every declared type", async () => {
    entityConfigs = declareTypes({
      Participant: { name: { dataType: "string" } },
      Session: { title: { dataType: "string" } },
    });
    spec = { Participant: { count: 3 } };

    const store = TestBed.inject(DemoEntityStore);
    await engine.init();
    engine["generateEntities"]();

    expect(store.get("Participant")).toHaveLength(3);
    // a type the spec says nothing about still gets records
    expect(store.get("Session").length).toBeGreaterThan(0);
  });

  it("leaves a type to the generator that owns it", async () => {
    entityConfigs = declareTypes({
      Participant: { name: { dataType: "string" } },
    });

    await engine.init(["Participant"]);
    engine["generateEntities"]();

    expect(TestBed.inject(DemoEntityStore).get("Participant")).toEqual([]);
  });

  describe("filling a field", () => {
    it.each([
      [
        "a value from the pool",
        { pool: { dataType: "string" } },
        { fields: { pool: { valuePool: ["only"] } } },
        "pool",
        (value: any) => expect(value).toBe("only"),
      ],
      [
        "a value from the named faker method",
        { num: { dataType: "string" } },
        { fields: { num: { faker: "string.numeric", fakerArgs: [4] } } },
        "num",
        (value: any) => expect(value).toMatch(/^\d{4}$/),
      ],
      [
        "nothing for an unknown faker method",
        { broken: { dataType: "string" } },
        { fields: { broken: { faker: "not.a.method" } } },
        "broken",
        (value: any) => expect(value).toBeUndefined(),
      ],
      [
        "a first name for a field named so",
        { firstname: { dataType: "string" } },
        {},
        "firstname",
        (value: any) => expect(value).not.toMatch(/ /),
      ],
      [
        "a plain first and last name for a lone name field",
        { name: { dataType: "string" } },
        {},
        "name",
        (value: any) => expect(value).toMatch(/^[^ ]+ [^ ]+$/),
      ],
      [
        "nothing for a datatype without a generator",
        { attachment: { dataType: "file" } },
        {},
        "attachment",
        (value: any) => expect(value).toBeUndefined(),
      ],
      [
        "nothing for an internal field",
        { secret: { dataType: "string", isInternalField: true } },
        {},
        "secret",
        (value: any) => expect(value).toBeUndefined(),
      ],
    ])("sets %s", async (_name, attributes, typeSpec, field, assert) => {
      entityConfigs = declareTypes({ Thing: attributes });
      spec = { Thing: { count: 1, ...typeSpec } };

      const [record] = await generate("Thing");

      assert(record[field]);
    });
  });

  it("never leaves a required text field empty, whatever the null probability", async () => {
    entityConfigs = declareTypes({
      Thing: {
        needed: { dataType: "string", validators: { required: true } },
        optional: { dataType: "string" },
      },
    });
    spec = {
      Thing: {
        count: 5,
        fields: {
          needed: { nullProbability: 1 },
          optional: { nullProbability: 1 },
        },
      },
    };

    const records = await generate("Thing");

    expect(records.every((record) => !!record["needed"])).toBe(true);
    expect(records.every((record) => record["optional"] === undefined)).toBe(
      true,
    );
  });

  it("keeps a date on or after the field it must not precede", async () => {
    entityConfigs = declareTypes({
      Thing: {
        start: { dataType: "date-only" },
        end: { dataType: "date-only" },
      },
    });
    spec = { Thing: { count: 20, fields: { end: { after: "start" } } } };

    const records = await generate("Thing");

    expect(records.every((record) => record["end"] >= record["start"])).toBe(
      true,
    );
  });

  it("keeps an end date after its start date without the spec saying so", async () => {
    // a use case written without a demo data spec must still get coherent ranges
    entityConfigs = declareTypes({
      Thing: {
        dateStart: { dataType: "date-only" },
        dateEnd: { dataType: "date-only" },
      },
    });
    spec = { Thing: { count: 20 } };

    const records = await generate("Thing");

    expect(
      records.every((record) => record["dateEnd"] >= record["dateStart"]),
    ).toBe(true);
  });

  it("keeps the order when the schema lists the end date first", async () => {
    entityConfigs = declareTypes({
      Thing: {
        end: { dataType: "date-only" },
        start: { dataType: "date-only" },
      },
    });
    spec = { Thing: { count: 20, fields: { end: { after: "start" } } } };

    const records = await generate("Thing");

    expect(records.every((record) => record["end"] >= record["start"])).toBe(
      true,
    );
  });

  it("applies one sample per record without overwriting what is set already", async () => {
    entityConfigs = declareTypes({
      Thing: {
        remark: { dataType: "string" },
        note: { dataType: "string" },
      },
    });
    spec = {
      Thing: {
        count: 10,
        samples: [{ remark: "first", note: "one" }, { remark: "second" }],
      },
    };

    const records = await generate("Thing");

    expect(
      records.every((record) => ["first", "second"].includes(record["remark"])),
    ).toBe(true);
    // a field the chosen sample does not mention is generated as usual
    expect(records.every((record) => !!record["note"])).toBe(true);
  });

  it("gives a dropdown an option even where a default value is configured", async () => {
    entityConfigs = declareTypes({
      Thing: {
        status: {
          dataType: "configurable-enum",
          additional: "status",
          defaultValue: { mode: "static", config: { value: "A" } },
        },
      },
    });
    spec = { Thing: { count: 1 } };

    const [record] = await generate("Thing");

    expect(["A", "B"]).toContain(record["status"].id);
  });

  it("never writes a framework field a config re-declares as an attribute", async () => {
    // some use cases list _id and inactive among their attributes: writing them would
    // overwrite the record identity and silently archive records
    entityConfigs = declareTypes({
      Thing: {
        _id: { dataType: "string" },
        _rev: { dataType: "string" },
        inactive: { dataType: "boolean" },
        name: { dataType: "string" },
      },
    });
    spec = { Thing: { count: 4 } };

    const records = await generate("Thing");

    expect(new Set(records.map((record) => record.getId())).size).toBe(4);
    expect(records.every((record) => record["_rev"] === undefined)).toBe(true);
    expect(records.every((record) => record.inactive === undefined)).toBe(true);
    expect(records.every((record) => !!record["name"])).toBe(true);
  });

  it.each([
    ["an option the spec allows", ["B"], "B"],
    ["nothing when the spec allows none that exist", ["gone"], undefined],
  ])("gives a dropdown %s", async (_name, ids, expected) => {
    entityConfigs = declareTypes({
      Thing: {
        status: { dataType: "configurable-enum", additional: "status" },
      },
    });
    spec = { Thing: { count: 1, fields: { status: { ids } } } };

    const [record] = await generate("Thing");

    expect(record["status"]?.id).toBe(expected);
  });

  it.each([
    ["only an upper bound below the default lower one", { max: 3 }],
    ["only a lower bound above the default upper one", { min: 90 }],
    ["bounds the wrong way round", { min: 40, max: 10 }],
  ])("still generates an age given %s", async (_name, bounds) => {
    // faker rejects an inverted range by throwing, which would abort the whole run
    entityConfigs = declareTypes({
      Thing: { born: { dataType: "date-with-age" } },
    });
    spec = { Thing: { count: 3, fields: { born: bounds } } };

    const records = await generate("Thing");

    expect(records).toHaveLength(3);
    expect(records.every((record) => record["born"] instanceof Date)).toBe(
      true,
    );
  });

  describe("linking records", () => {
    beforeEach(() => {
      entityConfigs = declareTypes({
        Participant: {
          partner: { dataType: "entity", additional: "Organisation" },
          peers: {
            dataType: "entity",
            additional: "Participant",
            isArray: true,
          },
          missing: { dataType: "entity", additional: "NotGenerated" },
        },
        Organisation: { name: { dataType: "string" } },
      });
    });

    it("fills a reference from the records of its target type", async () => {
      spec = { Participant: { count: 5 }, Organisation: { count: 2 } };
      const participants = await generate("Participant");
      const organisations = TestBed.inject(DemoEntityStore).get("Organisation");
      engine.linkReferences();

      const ids = organisations.map((organisation) => organisation.getId());
      expect(
        participants.every((participant) =>
          ids.includes(participant["partner"]),
        ),
      ).toBe(true);
    });

    it("leaves a reference empty when its target type has no records", async () => {
      spec = { Participant: { count: 3 }, Organisation: { count: 0 } };
      const participants = await generate("Participant");
      engine.linkReferences();

      expect(
        participants.every(
          (participant) =>
            participant["partner"] === undefined &&
            participant["missing"] === undefined,
        ),
      ).toBe(true);
    });

    it("never links a record to itself", async () => {
      spec = { Participant: { count: 6 }, Organisation: { count: 1 } };
      const participants = await generate("Participant");
      engine.linkReferences();

      expect(
        participants.every(
          (participant) => !participant["peers"].includes(participant.getId()),
        ),
      ).toBe(true);
    });

    it("keeps the gaps a generator left in a reference it manages", async () => {
      // the roots of a hierarchy have no parent on purpose: a generator that set the
      // field on some of its records decides for all of them
      spec = { Organisation: { count: 2 } };
      await engine.init(["Participant"]);
      engine["generateEntities"]();

      const store = TestBed.inject(DemoEntityStore);
      const root = TestEntityOfType("Participant");
      const child = TestEntityOfType("Participant");
      child["partner"] = "Organisation:set-by-the-generator";
      store.add("Participant", [root, child]);

      engine.linkReferences();

      expect(root["partner"]).toBeUndefined();
      expect(child["partner"]).toBe("Organisation:set-by-the-generator");
    });

    it("keeps a reference another generator set itself", async () => {
      spec = { Participant: { count: 1 }, Organisation: { count: 2 } };
      const [participant] = await generate("Participant");
      participant["partner"] = "Organisation:chosen-by-hand";
      engine.linkReferences();

      expect(participant["partner"]).toBe("Organisation:chosen-by-hand");
    });
  });
});
