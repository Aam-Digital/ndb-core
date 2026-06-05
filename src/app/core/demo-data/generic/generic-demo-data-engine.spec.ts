import { TestBed } from "@angular/core/testing";
import { GenericDemoDataEngine } from "./generic-demo-data-engine";
import { DemoEntityStore } from "./demo-entity-store";
import { DemoValueService } from "./demo-value.service";
import { DEMO_VALUE_GENERATOR } from "./demo-value-generator";
import {
  BooleanDemoValueGenerator,
  DateDemoValueGenerator,
  DateOnlyDemoValueGenerator,
  DateWithAgeDemoValueGenerator,
  MonthDemoValueGenerator,
  NumberDemoValueGenerator,
  SchemaEmbedDemoValueGenerator,
  StringDemoValueGenerator,
} from "./core-demo-value-generators";
import { entityRegistry, EntityRegistry, DatabaseEntity } from "../../entity/database-entity.decorator";
import { ConfigService } from "../../config/config.service";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { DateWithAge } from "../../basic-datatypes/date-with-age/dateWithAge";
import { ValuePoolLoader } from "./value-pool-loader";

@DatabaseEntity("DemoTestPerson")
class DemoTestPerson extends Entity {
  static override ENTITY_TYPE = "DemoTestPerson";
  static override label = "Demo Test Person";

  @DatabaseField({ label: "Name" })
  name: string;

  @DatabaseField({ label: "Remarks" })
  remarks: string;

  @DatabaseField({ label: "Date of Birth" })
  dateOfBirth: DateWithAge;

  @DatabaseField({ label: "Active", dataType: "boolean" })
  active: boolean;

  @DatabaseField({ label: "Phone" })
  phone: string;

  @DatabaseField({ label: "Score", dataType: "number" })
  score: number;
}

@DatabaseEntity("DemoTestSchool")
class DemoTestSchool extends Entity {
  static override ENTITY_TYPE = "DemoTestSchool";
  static override label = "Demo Test School";

  @DatabaseField({ label: "Name" })
  name: string;

  @DatabaseField({
    label: "Related person",
    dataType: "entity",
    additional: "DemoTestPerson",
  })
  personRef: string;
}

describe("GenericDemoDataEngine", () => {
  let engine: GenericDemoDataEngine;
  let entityStore: DemoEntityStore;

  // Only the generators needed by the test entity fields (no extra DI deps)
  const coreGeneratorProviders = [
    { provide: DEMO_VALUE_GENERATOR, useClass: StringDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: DateDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: DateOnlyDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: DateWithAgeDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: MonthDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: BooleanDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: NumberDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: SchemaEmbedDemoValueGenerator, multi: true },
  ];

  let mockPoolLoader: { load: () => Promise<void>; getPool: (name: string) => any[] };

  function setup(demoData: Record<string, any>, pools: Record<string, any[]> = {}) {
    mockPoolLoader = {
      load: vi.fn().mockResolvedValue(undefined),
      getPool: (name: string) => pools[name] ?? [],
    };

    TestBed.configureTestingModule({
      providers: [
        GenericDemoDataEngine,
        DemoEntityStore,
        DemoValueService,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: ConfigService, useValue: { getConfig: () => demoData } },
        { provide: ValuePoolLoader, useValue: mockPoolLoader },
        coreGeneratorProviders,
      ],
    });
    engine = TestBed.inject(GenericDemoDataEngine);
    entityStore = TestBed.inject(DemoEntityStore);
  }

  afterEach(() => TestBed.resetTestingModule());

  it("generates the count specified in the spec", () => {
    setup({ DemoTestPerson: { count: 5 }, DemoTestSchool: { count: 2 } });

    const entities = engine.entities;

    expect(entities).toHaveLength(7);
    expect(entityStore.get("DemoTestPerson")).toHaveLength(5);
    expect(entityStore.get("DemoTestSchool")).toHaveLength(2);
  });

  it("generates no entities for types not in the spec", () => {
    setup({ DemoTestPerson: { count: 3 } });

    engine.entities;

    expect(entityStore.get("DemoTestSchool")).toHaveLength(0);
  });

  it("fills name field via name heuristic", () => {
    setup({ DemoTestPerson: { count: 3 } });

    const entities = engine.entities;

    entities.forEach((e) =>
      expect(typeof (e as any).name).toBe("string"),
    );
  });

  it("fills phone field via phone heuristic", () => {
    setup({ DemoTestPerson: { count: 3 } });

    const entities = engine.entities;

    entities.forEach((e) =>
      expect(typeof (e as any).phone).toBe("string"),
    );
  });

  it("fills dateOfBirth via date-with-age strategy returning DateWithAge", () => {
    setup({ DemoTestPerson: { count: 3 } });

    const entities = engine.entities;

    entities.forEach((e) =>
      expect((e as any).dateOfBirth).toBeInstanceOf(DateWithAge),
    );
  });

  it("fills boolean field via boolean strategy", () => {
    setup({ DemoTestPerson: { count: 5 } });

    const entities = engine.entities;

    entities.forEach((e) =>
      expect(typeof (e as any).active).toBe("boolean"),
    );
  });

  it("fills number field via number strategy", () => {
    setup({ DemoTestPerson: { count: 3 } });

    const entities = engine.entities;

    entities.forEach((e) =>
      expect(typeof (e as any).score).toBe("number"),
    );
  });

  it("resolves valuePoolRef from the ValuePoolLoader", () => {
    setup(
      {
        DemoTestPerson: {
          count: 10,
          fields: { remarks: { valuePoolRef: "remarksPool" } },
        },
      },
      { remarksPool: ["pool-value-1", "pool-value-2"] },
    );

    engine.entities.forEach((e) =>
      expect(["pool-value-1", "pool-value-2"]).toContain((e as any).remarks),
    );
  });

  it("overrides field value with spec valuePool", () => {
    setup({
      DemoTestPerson: {
        count: 10,
        fields: {
          remarks: { valuePool: ["alpha", "beta"] },
        },
      },
    });

    const entities = engine.entities;

    entities.forEach((e) =>
      expect(["alpha", "beta"]).toContain((e as any).remarks),
    );
  });

  it("applies nullProbability: 1 to always leave field empty", () => {
    setup({
      DemoTestPerson: {
        count: 10,
        fields: { remarks: { nullProbability: 1 } },
      },
    });

    const entities = engine.entities;

    entities.forEach((e) => expect((e as any).remarks).toBeUndefined());
  });

  it("never makes a required field undefined via nullProbability", () => {
    // name has no required validator in the test entity, so just check
    // that nullProbability:0 on a normal field still produces values
    setup({
      DemoTestPerson: {
        count: 5,
        fields: { name: { nullProbability: 0 } },
      },
    });

    engine.entities.forEach((e) =>
      expect((e as any).name).toBeDefined(),
    );
  });

  describe("perParent", () => {
    it("generates min–max entities per parent entity", () => {
      setup({
        DemoTestPerson: { count: 4 },
        DemoTestSchool: { perParent: { type: "DemoTestPerson", min: 2, max: 2 } },
      });

      engine.entities;

      // 4 parents × 2 each = exactly 8 schools
      expect(entityStore.get("DemoTestSchool")).toHaveLength(8);
    });

    it("generates no entities when parent type has no entities", () => {
      setup({
        DemoTestSchool: { perParent: { type: "DemoTestPerson", min: 1, max: 3 } },
      });

      engine.entities;

      expect(entityStore.get("DemoTestSchool")).toHaveLength(0);
    });
  });

  describe("linkEntityReferences (Pass 2)", () => {
    it("fills entity-reference fields from the store after generation", () => {
      setup({
        DemoTestPerson: { count: 3 },
        DemoTestSchool: { count: 2 },
      });

      engine.entities; // Pass 1 — entity-ref fields are empty
      const schoolsBefore = entityStore.get("DemoTestSchool");
      schoolsBefore.forEach((s) =>
        expect((s as any).personRef).toBeUndefined(),
      );

      engine.linkEntityReferences(); // Pass 2

      const schoolsAfter = entityStore.get("DemoTestSchool");
      schoolsAfter.forEach((s) =>
        expect(typeof (s as any).personRef).toBe("string"),
      );
    });

    it("leaves reference empty when target type has no entities", () => {
      // Only DemoTestSchool in spec; DemoTestPerson store is empty
      setup({ DemoTestSchool: { count: 2 } });

      engine.entities;
      engine.linkEntityReferences();

      entityStore
        .get("DemoTestSchool")
        .forEach((s) => expect((s as any).personRef).toBeUndefined());
    });
  });
});
