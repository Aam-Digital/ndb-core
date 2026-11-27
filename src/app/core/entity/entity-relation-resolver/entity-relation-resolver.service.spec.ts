import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";

import { EntityRelationResolverService } from "./entity-relation-resolver.service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { MockEntityMapperService } from "../entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { DatabaseEntity } from "../database-entity.decorator";
import { Entity } from "../model/entity";
import { DatabaseField } from "../database-field.decorator";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { AttendanceItem } from "#src/app/features/attendance/model/attendance-item";

describe("EntityRelationResolverService", () => {
  let service: EntityRelationResolverService;
  let entityMapper: MockEntityMapperService;

  /** holds relations nested inside embedded (non-entity) objects, like Note.childrenAttendance */
  @DatabaseEntity("EntityWithAttendanceItems")
  class EntityWithAttendanceItems extends Entity {
    @DatabaseField()
    attendanceItems: AttendanceItem[] = [];
  }

  /** an entity-reference field without a configured fallback entity type */
  @DatabaseEntity("EntityWithUntypedRef")
  class EntityWithUntypedRef extends Entity {
    @DatabaseField({ dataType: EntityDatatype.dataType })
    ref: string;
  }

  /** a second, unrelated entity type, to test relations to different target types */
  @DatabaseEntity("OtherTestEntity")
  class OtherTestEntity extends Entity {
    @DatabaseField()
    name: string;
  }

  /** two relation properties, referencing two different entity types */
  @DatabaseEntity("EntityWithMultipleRelations")
  class EntityWithMultipleRelations extends Entity {
    @DatabaseField({
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    })
    refA: string;

    @DatabaseField({
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: OtherTestEntity.ENTITY_TYPE,
    })
    refsB: string[];
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CoreTestingModule] });
    service = TestBed.inject(EntityRelationResolverService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  it("returns data without an entity schema unchanged", async () => {
    const plain = { foo: "bar" };

    const result = await service.resolveRelations(plain);

    expect(result).toEqual(plain);
  });

  it("preserves enumerable properties that are not part of the schema", async () => {
    const primary = TestEntity.create("Primary");
    (primary as any).extraRuntimeProp = "computed value";

    const result = await service.resolveRelations(primary);

    expect((result as any).extraRuntimeProp).toBe("computed value");
    // schema fields are still processed as usual alongside it
    expect(result.name).toBe("Primary");
  });

  it("resolves a property holding a single entity reference id", async () => {
    const related = TestEntity.create("Related");
    entityMapper.add(related);
    const primary = TestEntity.create("Primary");
    primary.ref = related.getId();

    const result = await service.resolveRelations(primary);

    expect(result.ref).toEqual(
      expect.objectContaining({ name: "Related", _id: related.getId() }),
    );
  });

  it("resolves a property holding multiple entity reference ids", async () => {
    const related1 = TestEntity.create("Related1");
    const related2 = TestEntity.create("Related2");
    entityMapper.addAll([related1, related2]);
    const primary = TestEntity.create("Primary");
    primary.refMixed = [related1.getId(), related2.getId()];

    const result = await service.resolveRelations(primary);

    expect(result.refMixed).toEqual([
      expect.objectContaining({ name: "Related1" }),
      expect.objectContaining({ name: "Related2" }),
    ]);
  });

  it("resolves entity references nested inside array-of-embedded-object properties (AttendanceItem)", async () => {
    const child1 = TestEntity.create("Child1");
    const child2 = TestEntity.create("Child2");
    entityMapper.addAll([child1, child2]);
    const primary = new EntityWithAttendanceItems();
    primary.attendanceItems = [
      new AttendanceItem(undefined, "on time", child1.getId()),
      new AttendanceItem(undefined, "late", child2.getId()),
    ];

    const result = await service.resolveRelations(primary);

    expect(result.attendanceItems).toEqual([
      expect.objectContaining({
        remarks: "on time",
        participant: expect.objectContaining({ name: "Child1" }),
      }),
      expect.objectContaining({
        remarks: "late",
        participant: expect.objectContaining({ name: "Child2" }),
      }),
    ]);
  });

  it("resolves multiple properties with relationships on the same entity, loading each referenced type only once", async () => {
    const relatedA = TestEntity.create("RelatedA");
    const relatedB1 = Object.assign(new OtherTestEntity(), {
      name: "RelatedB1",
    });
    const relatedB2 = Object.assign(new OtherTestEntity(), {
      name: "RelatedB2",
    });
    entityMapper.addAll([relatedA, relatedB1, relatedB2]);
    const loadTypeSpy = vi.spyOn(entityMapper, "loadType");

    const primary = new EntityWithMultipleRelations();
    primary.refA = relatedA.getId();
    primary.refsB = [relatedB1.getId(), relatedB2.getId()];

    const result = await service.resolveRelations(primary);

    expect(result.refA).toEqual(expect.objectContaining({ name: "RelatedA" }));
    expect(result.refsB).toEqual([
      expect.objectContaining({ name: "RelatedB1" }),
      expect.objectContaining({ name: "RelatedB2" }),
    ]);
    // one loadType call for "TestEntity" (refA) and one for "OtherTestEntity" (refsB's two ids), not three
    expect(loadTypeSpy).toHaveBeenCalledTimes(2);
  });

  it("keeps only stubs of the ids in the fields given as idsOnly, without loading their records", async () => {
    const relatedA = TestEntity.create("RelatedA");
    const relatedB = Object.assign(new OtherTestEntity(), { name: "B" });
    entityMapper.addAll([relatedA, relatedB]);
    const loadTypeSpy = vi.spyOn(entityMapper, "loadType");
    const primary = new EntityWithMultipleRelations();
    primary.refA = relatedA.getId();
    primary.refsB = [relatedB.getId()];

    const result = await service.resolveRelations(primary, undefined, {
      idsOnly: ["refsB"],
    });

    expect(result.refsB).toEqual([{ _id: relatedB.getId() }]);
    expect(result.refA).toEqual(expect.objectContaining({ name: "RelatedA" }));
    expect(loadTypeSpy).toHaveBeenCalledTimes(1);
  });

  it("creates a stub object for an entity reference that cannot be found", async () => {
    const primary = TestEntity.create("Primary");
    primary.ref = TestEntity.createPrefixedId(
      TestEntity.ENTITY_TYPE,
      "does-not-exist",
    );

    const result = await service.resolveRelations(primary);

    expect(result.ref).toEqual({ _id: primary.ref });
  });

  it("creates a stub object when the referenced entity type cannot be determined", async () => {
    const primary = new EntityWithUntypedRef();
    primary.ref = "some-id-without-a-type-prefix";

    const result = await service.resolveRelations(primary);

    expect(result.ref).toEqual({ _id: "some-id-without-a-type-prefix" });
  });

  it("creates stub objects when loading the referenced type fails", async () => {
    const primary = TestEntity.create("Primary");
    primary.ref = TestEntity.createPrefixedId(TestEntity.ENTITY_TYPE, "x");
    vi.spyOn(entityMapper, "loadType").mockRejectedValue(
      new Error("failed to load"),
    );

    const result = await service.resolveRelations(primary);

    expect(result.ref).toEqual({ _id: primary.ref });
  });

  it.each([
    [undefined, 1],
    [2, 2],
    [3, 3],
  ])(
    "resolves linked records as many levels deep as given (%s), keeping the raw ids below the last level",
    async (levels, expectedLevels) => {
      // a chain of records, each linking to the next one
      const chain = ["Level0", "Level1", "Level2", "Level3", "Level4"].map(
        (name) => TestEntity.create(name),
      );
      chain.slice(1).forEach((entity, i) => (chain[i].ref = entity.getId()));
      entityMapper.addAll(chain.slice(1));

      const result = await service.resolveRelations(chain[0], undefined, {
        levels,
      });

      let resolved: any = result;
      for (let level = 1; level <= expectedLevels; level++) {
        resolved = resolved.ref;
        expect(resolved.name).toBe(`Level${level}`);
      }
      expect(resolved.ref).toBe(chain[expectedLevels + 1].getId());
    },
  );

  it("does not resolve the links of a record again that is already resolved above it (a circle)", async () => {
    const primary = TestEntity.create("Primary");
    const related = TestEntity.create("Related");
    primary.ref = related.getId();
    related.ref = primary.getId();
    entityMapper.addAll([primary, related]);

    const result = await service.resolveRelations(primary, undefined, {
      levels: 5,
    });

    // the record linked again keeps its own fields, but its link back is not followed again
    const resolvedRelated = result.ref as unknown as TestEntity;
    expect(resolvedRelated.ref).toEqual(
      expect.objectContaining({ name: "Primary", ref: related.getId() }),
    );
  });

  it("does not modify the original entities passed in", async () => {
    const related = TestEntity.create("Related");
    entityMapper.add(related);
    const primary = TestEntity.create("Primary");
    primary.ref = related.getId();
    const attendanceItem = new AttendanceItem(undefined, "", related.getId());
    const primaryWithAttendance = new EntityWithAttendanceItems();
    primaryWithAttendance.attendanceItems = [attendanceItem];

    const result = await service.resolveRelations(primary);
    const resultWithAttendance = await service.resolveRelations(
      primaryWithAttendance,
    );

    // originals still hold the raw, unresolved id(s)
    expect(primary.ref).toBe(related.getId());
    expect(attendanceItem.participant).toBe(related.getId());
    // the resolved related entity is a copy, not the same object still used elsewhere
    expect(result.ref).not.toBe(related);
    expect(resultWithAttendance.attendanceItems[0]).not.toBe(attendanceItem);
  });

  it("resolves relations for every record in an array input", async () => {
    const related = TestEntity.create("Related");
    entityMapper.add(related);
    const primary1 = TestEntity.create("Primary1");
    primary1.ref = related.getId();
    const primary2 = TestEntity.create("Primary2");
    primary2.ref = related.getId();

    const result = await service.resolveRelations([primary1, primary2]);

    expect(result).toHaveLength(2);
    expect(result[0].ref).toEqual(expect.objectContaining({ name: "Related" }));
    expect(result[1].ref).toEqual(expect.objectContaining({ name: "Related" }));
  });
});
