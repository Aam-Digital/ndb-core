import { Injectable } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Entity } from "../model/entity";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../database-entity.decorator";
import { DatabaseField } from "../database-field.decorator";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { EntitySchema } from "./entity-schema";
import { EntitySchemaService } from "./entity-schema.service";
import { SchemaEmbedDatatype } from "../../basic-datatypes/schema-embed/schema-embed.datatype";
import { AttendanceDatatype } from "../../../features/attendance/model/attendance.datatype";
import { AttendanceItem } from "../../../features/attendance/model/attendance-item";
import { EventAttendanceMapDatatype } from "../../../features/attendance/deprecated/event-attendance-map.datatype";
import { mockEntityMapperProvider } from "../entity-mapper/mock-entity-mapper-service";
import {
  getEmbeddedFieldRefs,
  getEmbeddedSchema,
  resolveEmbeddedField,
} from "./embedded-schema-field.util";

describe("embedded-schema-field.util", () => {
  let schemaService: EntitySchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EntitySchemaService,
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: DefaultDatatype,
          useClass: SchemaEmbedDatatype,
          multi: true,
        },
        { provide: DefaultDatatype, useClass: AttendanceDatatype, multi: true },
        {
          provide: DefaultDatatype,
          useClass: EventAttendanceMapDatatype,
          multi: true,
        },
      ],
    });
    schemaService = TestBed.inject(EntitySchemaService);
  });

  describe("array detection for the modern `attendance` datatype (AttendanceItem: entity, configurable-enum, string)", () => {
    @DatabaseEntity("EmbeddedUtilModernTestEntity")
    class ModernTestEntity extends Entity {}
    ModernTestEntity.schema.set("attendance", {
      dataType: "attendance",
      isArray: true,
      label: "Attendance",
    });

    it("detects isArray for the entity-reference inner property (participant)", () => {
      const ref = resolveEmbeddedField(
        schemaService,
        ModernTestEntity,
        "attendance.participant",
      );

      expect(ref.innerSchema.dataType).toEqual("entity");
      expect(ref.isArray).toBe(true);
    });

    it("detects isArray for the configurable-enum inner property (status)", () => {
      const ref = resolveEmbeddedField(
        schemaService,
        ModernTestEntity,
        "attendance.status",
      );

      expect(ref.innerSchema.dataType).toEqual("configurable-enum");
      expect(ref.isArray).toBe(true);
    });

    it("detects isArray for the string inner property (remarks)", () => {
      const ref = resolveEmbeddedField(
        schemaService,
        ModernTestEntity,
        "attendance.remarks",
      );

      expect(ref.innerSchema.dataType).toEqual("string");
      expect(ref.isArray).toBe(true);
    });

    it("lists all of AttendanceItem's properties as isArray via getEmbeddedFieldRefs", () => {
      const refs = getEmbeddedFieldRefs(schemaService, ModernTestEntity);

      expect(refs.map((r) => r.innerProp)).toEqual(
        expect.arrayContaining(["participant", "status", "remarks"]),
      );
      expect(refs.every((r) => r.isArray)).toBe(true);
    });
  });

  describe("array detection for the deprecated `event-attendance-map` datatype (AttendanceItem)", () => {
    @DatabaseEntity("EmbeddedUtilLegacyTestEntity")
    class LegacyTestEntity extends Entity {}
    LegacyTestEntity.schema.set("childrenAttendance", {
      dataType: "event-attendance-map",
      label: "Attendance",
      additional: {
        // no dataType here - relies on being forwarded from AttendanceItem.participant
        participant: { additional: ["Child"] },
      },
    });

    it("detects isArray as true even though `isArray` is not set on the field itself", () => {
      // this field intentionally cannot set isArray:true at the schema level, see
      // ALWAYS_ARRAY_EMBEDDED_DATATYPES - this test guards that special case
      expect(
        LegacyTestEntity.schema.get("childrenAttendance").isArray,
      ).toBeFalsy();

      const ref = resolveEmbeddedField(
        schemaService,
        LegacyTestEntity,
        "childrenAttendance.participant",
      );

      expect(ref.isArray).toBe(true);
    });

    it("merges dataType and label from AttendanceItem.participant with the additional override", () => {
      const baseLabel = AttendanceItem.schema.get("participant").label;
      expect(baseLabel).toBeTruthy(); // sanity check that there is something to inherit

      const ref = resolveEmbeddedField(
        schemaService,
        LegacyTestEntity,
        "childrenAttendance.participant",
      );

      // dataType and label are inherited from AttendanceItem.participant, since the
      // additional override here only restricts the allowed entity type
      expect(ref.innerSchema.dataType).toEqual("entity");
      expect(ref.innerSchema.label).toEqual(baseLabel);
      expect(ref.innerSchema.additional).toEqual(["Child"]);
    });

    it("also discovers status and remarks via AttendanceItem, even without any additional override for them", () => {
      const refs = getEmbeddedFieldRefs(schemaService, LegacyTestEntity);

      expect(refs.map((r) => r.innerProp)).toEqual(
        expect.arrayContaining(["participant", "status", "remarks"]),
      );
      expect(refs.every((r) => r.isArray)).toBe(true);

      const statusRef = refs.find((r) => r.innerProp === "status");
      expect(statusRef.innerSchema.dataType).toEqual("configurable-enum");
      const remarksRef = refs.find((r) => r.innerProp === "remarks");
      expect(remarksRef.innerSchema.dataType).toEqual("string");
    });
  });

  describe("getEmbeddedSchema merging the embeddedType's own field with an additional override", () => {
    it("forwards dataType and label from AttendanceItem.participant when the override only sets additional", () => {
      const baseLabel = AttendanceItem.schema.get("participant").label;
      expect(baseLabel).toBeTruthy(); // sanity check that there is something to inherit

      const schema = getEmbeddedSchema(schemaService, {
        dataType: "attendance",
        additional: { participant: { additional: ["Child"] } },
      });

      expect(schema.get("participant")).toEqual(
        expect.objectContaining({
          dataType: "entity",
          label: baseLabel,
          additional: ["Child"],
          id: "participant",
        }),
      );
    });

    it("lets an explicit dataType in the override win over the inherited one", () => {
      const schema = getEmbeddedSchema(schemaService, {
        dataType: "attendance",
        additional: { participant: { dataType: "string" } },
      });

      expect(schema.get("participant").dataType).toEqual("string");
    });

    it("returns undefined for a field that is not an embedded schema field at all", () => {
      expect(
        getEmbeddedSchema(schemaService, { dataType: "string" }),
      ).toBeUndefined();
      expect(getEmbeddedSchema(schemaService, undefined)).toBeUndefined();
    });

    it("does not read inner fields from an object-shaped `additional` of a non-embedded datatype", () => {
      expect(
        getEmbeddedSchema(schemaService, {
          dataType: "string",
          additional: { someOption: { dataType: "string" } },
        }),
      ).toBeUndefined();
    });

    it("reads inner fields of a config-only `schema-embed` field (without an embeddedType)", () => {
      const schema = getEmbeddedSchema(schemaService, {
        dataType: "schema-embed",
        additional: { phone: { dataType: "string" } },
      });

      expect(schema.get("phone")).toEqual({ dataType: "string", id: "phone" });
    });
  });
});

describe("embedded-schema-field.util (single, non-array embedded object)", () => {
  class SingleEmbedInner {
    declare static schema: EntitySchema;

    @DatabaseField({ dataType: "string" })
    phoneType: string;
  }

  @Injectable()
  class SingleEmbedTestDatatype extends SchemaEmbedDatatype {
    static override readonly dataType = "embedded-util-test-single";
    override embeddedType = SingleEmbedInner;
  }

  @DatabaseEntity("EmbeddedUtilSingleTestEntity")
  class SingleTestEntity extends Entity {}
  SingleTestEntity.schema.set("contact", {
    dataType: "embedded-util-test-single",
    label: "Contact",
  });

  let schemaService: EntitySchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EntitySchemaService,
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: DefaultDatatype,
          useClass: SingleEmbedTestDatatype,
          multi: true,
        },
      ],
    });
    schemaService = TestBed.inject(EntitySchemaService);
  });

  it("does not mark a single embedded object field as an array", () => {
    const ref = resolveEmbeddedField(
      schemaService,
      SingleTestEntity,
      "contact.phoneType",
    );

    expect(ref.innerSchema.dataType).toEqual("string");
    expect(ref.isArray).toBe(false);
  });
});
