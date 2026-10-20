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
  getEmbeddedFieldId,
  getEmbeddedFieldRefs,
  getEmbeddedSchema,
  resolveEmbeddedField,
} from "./embedded-schema-field.util";

describe("embedded-schema-field.util", () => {
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

  @DatabaseEntity("EmbeddedUtilTestEntity")
  class EmbedTestEntity extends Entity {}
  EmbedTestEntity.schema.set("name", { dataType: "string" });
  EmbedTestEntity.schema.set("attendance", {
    dataType: "attendance",
    isArray: true,
  });
  // the deprecated datatype cannot declare `isArray` on the field itself
  EmbedTestEntity.schema.set("childrenAttendance", {
    dataType: "event-attendance-map",
  });
  EmbedTestEntity.schema.set("contact", {
    dataType: "embedded-util-test-single",
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
          useClass: SchemaEmbedDatatype,
          multi: true,
        },
        { provide: DefaultDatatype, useClass: AttendanceDatatype, multi: true },
        {
          provide: DefaultDatatype,
          useClass: EventAttendanceMapDatatype,
          multi: true,
        },
        {
          provide: DefaultDatatype,
          useClass: SingleEmbedTestDatatype,
          multi: true,
        },
      ],
    });
    schemaService = TestBed.inject(EntitySchemaService);
  });

  it.each([
    ["attendance.participant", "entity", true],
    ["attendance.status", "configurable-enum", true],
    ["attendance.remarks", "string", true],
    ["childrenAttendance.participant", "entity", true],
    ["childrenAttendance.status", "configurable-enum", true],
    ["contact.phoneType", "string", false],
  ])(
    "resolves %s as a %s property, inside an array: %s",
    (fieldId, dataType, isArray) => {
      const ref = resolveEmbeddedField(schemaService, EmbedTestEntity, fieldId);

      expect(ref.innerSchema.dataType).toEqual(dataType);
      expect(ref.isArray).toBe(isArray);
    },
  );

  it.each(["name", "name.length", "attendance.unknown"])(
    "does not resolve %s, which is not a property inside an embedded field",
    (fieldId) => {
      expect(
        resolveEmbeddedField(schemaService, EmbedTestEntity, fieldId),
      ).toBeUndefined();
    },
  );

  it("lists the properties inside all embedded fields, but no flat field", () => {
    const ids = getEmbeddedFieldRefs(schemaService, EmbedTestEntity).map(
      getEmbeddedFieldId,
    );

    expect(ids).toEqual(
      expect.arrayContaining([
        "attendance.participant",
        "attendance.status",
        "attendance.remarks",
        "childrenAttendance.participant",
        "childrenAttendance.status",
        "childrenAttendance.remarks",
        "contact.phoneType",
      ]),
    );
    expect(ids.filter((id) => id.startsWith("name"))).toEqual([]);
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
