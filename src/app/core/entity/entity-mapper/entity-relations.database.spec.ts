import { TestBed } from "@angular/core/testing";

import { EntityRelationsService } from "./entity-relations.service";
import { EntityMapperService } from "./entity-mapper.service";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { DatabaseEntity } from "../database-entity.decorator";
import { DatabaseField } from "../database-field.decorator";
import { Entity } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { toStoredFormatCondition } from "../../filter/stored-format";
import { SessionSubject } from "../../session/auth/session-info";

/**
 * These run against a real (in-memory) PouchDB rather than the mocked entity mapper,
 * because the point is exactly what the mock cannot reproduce: the query runs against the
 * *stored* format, while the in-memory post-filter runs against entity instances. A
 * selector that disagrees with the stored format silently finds nothing, which would let
 * a merge or a cascading delete drop references without any error.
 */
describe("EntityRelationsService querying a real database", () => {
  @DatabaseEntity("RelationQueryTarget")
  class RelationQueryTarget extends Entity {}

  @DatabaseEntity("RelationQuerySource")
  class RelationQuerySource extends Entity {
    @DatabaseField({ dataType: "entity", additional: "RelationQueryTarget" })
    refScalar: string;

    @DatabaseField({
      dataType: "entity",
      isArray: true,
      additional: "RelationQueryTarget",
    })
    refArray: string[];

    @DatabaseField({
      dataType: "schema-embed",
      isArray: true,
      additional: {
        participant: { dataType: "entity", additional: "RelationQueryTarget" },
      },
    })
    embeddedArray: { participant: string }[];

    @DatabaseField({
      dataType: "event-attendance-map",
      additional: {
        participant: { dataType: "entity", additional: "RelationQueryTarget" },
      },
    })
    legacyAttendance: any;
  }

  let service: EntityRelationsService;
  let entityMapper: EntityMapperService;
  let target: RelationQueryTarget;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [DatabaseTestingModule] });
    service = TestBed.inject(EntityRelationsService);
    entityMapper = TestBed.inject(EntityMapperService);

    // MemoryPouchDatabase reports supportsFind() === false by design, so without this the
    // service would quietly take the loadType path and these tests would prove nothing
    vi.spyOn(
      TestBed.inject(DatabaseResolverService).getDatabase(),
      "supportsFind",
    ).mockReturnValue(true);

    target = new RelationQueryTarget();
    await entityMapper.save(target);
  });

  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());

  async function saveSource(values: object): Promise<string> {
    const source = Object.assign(new RelationQuerySource(), values);
    await entityMapper.save(source);
    return source.getId();
  }

  async function idsLinkingToTarget(): Promise<string[]> {
    const linked = await service.loadAllLinkingToEntity(target);
    return linked.map(({ entity }) => entity.getId());
  }

  it.each([
    ["stored as a plain id", (id: string) => ({ refScalar: id })],
    ["stored as an array of ids", (id: string) => ({ refArray: [id] })],
    [
      // the field declares isArray, but an older document was written before it did
      "stored as a plain id in a field declared as an array",
      (id: string) => ({ refArray: id }),
    ],
    [
      "stored inside an array of embedded objects",
      (id: string) => ({ embeddedArray: [{ participant: id }] }),
    ],
    [
      "stored inside a legacy attendance map",
      (id: string) => ({ legacyAttendance: [{ participant: id }] }),
    ],
  ])("finds a reference %s", async (_name, buildValues) => {
    const referencing = await saveSource(buildValues(target.getId()));
    await saveSource({ refScalar: "RelationQueryTarget:someone-else" });

    expect(await idsLinkingToTarget()).toEqual([referencing]);
  });

  it("finds a reference in an embedded object saved before the field held a list of them", async () => {
    const legacyId = `${RelationQuerySource.ENTITY_TYPE}:legacy`;
    await TestBed.inject(DatabaseResolverService)
      .getDatabase()
      .put({ _id: legacyId, embeddedArray: { participant: target.getId() } });

    expect(await idsLinkingToTarget()).toEqual([legacyId]);
  });

  it.each([
    ["refArray", (id: string) => ({ refArray: id })],
    [
      "embeddedArray.participant",
      (id: string) => ({ embeddedArray: { participant: id } }),
    ],
  ])(
    "matches a link through %s in the database also in the shape saved before the field held a list",
    async (fieldPath, storedValues) => {
      const legacyId = `${RelationQuerySource.ENTITY_TYPE}:legacy`;
      await TestBed.inject(DatabaseResolverService)
        .getDatabase()
        .put({ _id: legacyId, ...storedValues(target.getId()) });

      const condition = {
        $or: service.referenceConditions(RelationQuerySource, fieldPath, [
          target.getId(),
        ]),
      };
      const found = await entityMapper.findAllType(
        RelationQuerySource,
        toStoredFormatCondition(
          condition,
          RelationQuerySource.schema,
          TestBed.inject(EntitySchemaService),
        ),
      );

      expect(found.map((record) => record.getId())).toEqual([legacyId]);
    },
  );

  it("reports every field of a record that references the target", async () => {
    const referencing = await saveSource({
      refScalar: target.getId(),
      refArray: [target.getId()],
    });

    const linked = await service.loadAllLinkingToEntity(target);

    expect(linked).toHaveLength(1);
    expect(linked[0].entity.getId()).toBe(referencing);
    expect(linked[0].fields.map((f) => f.id)).toEqual([
      "refScalar",
      "refArray",
    ]);
  });

  it("queries instead of loading the whole type", async () => {
    await saveSource({ refScalar: target.getId() });
    const loadType = vi.spyOn(entityMapper, "loadType");
    const findAllType = vi.spyOn(entityMapper, "findAllType");

    await service.loadAllLinkingToEntity(target);

    expect(findAllType).toHaveBeenCalledWith(
      RelationQuerySource,
      expect.anything(),
    );
    expect(loadType).not.toHaveBeenCalledWith(RelationQuerySource);
  });

  describe("loading the records linking to many entities in one field", () => {
    const targets = Array.from(
      { length: 60 },
      (_, i) => new RelationQueryTarget("target-" + i),
    );
    const firstId = targets[0].getId();
    const lastId = targets[59].getId();
    const targetIds = targets.map((t) => t.getId());

    beforeEach(() =>
      // a visitor without an account would load the whole type instead
      TestBed.inject(SessionSubject).next({
        id: "user",
        name: "user",
        roles: [],
      }),
    );

    const ids = (links: Map<string, Entity[]>) =>
      [...links].map(([id, entities]) => [
        id,
        entities.map((e) => e.getId()).sort(),
      ]);

    it.each([
      ["a database query", true],
      ["the reference index of a local database", false],
    ])(
      "groups the records by the entity they link to, found through %s",
      async (_name, supportsFind) => {
        vi.spyOn(
          TestBed.inject(DatabaseResolverService).getDatabase(),
          "supportsFind",
        ).mockReturnValue(supportsFind);
        const linkingToFirst = await saveSource({ refScalar: firstId });
        const linkingToBoth = await saveSource({
          refArray: [firstId, lastId],
        });
        // found only if the lookup includes the last id, not just the first
        const linkingToLastInArray = await saveSource({ refArray: [lastId] });
        // links to the last target only in the scalar field, not the array field
        const linkingToLast = await saveSource({ refScalar: lastId });
        const loadType = vi.spyOn(entityMapper, "loadType");

        const scalarLinks = await service.loadLinkingToEntities(
          targetIds,
          RelationQuerySource,
          "refScalar",
        );
        const arrayLinks = await service.loadLinkingToEntities(
          targetIds,
          RelationQuerySource,
          "refArray",
        );

        expect(new Map(ids(scalarLinks) as [string, string[]][])).toEqual(
          new Map([
            [firstId, [linkingToFirst]],
            [lastId, [linkingToLast]],
          ]),
        );
        expect(new Map(ids(arrayLinks) as [string, string[]][])).toEqual(
          new Map([
            [firstId, [linkingToBoth]],
            [lastId, [linkingToBoth, linkingToLastInArray].sort()],
          ]),
        );
        expect(loadType).not.toHaveBeenCalled();
      },
    );

    it.each(["embeddedArray", "legacyAttendance"])(
      "finds records linking to the entities inside the embedded objects of %s through a query",
      async (field) => {
        const embeddingFirst = await saveSource({
          [field]: [{ participant: firstId }, { participant: firstId }],
        });
        const embeddingLast = await saveSource({
          [field]: [{ participant: lastId }],
        });
        const loadType = vi.spyOn(entityMapper, "loadType");

        const links = await service.loadLinkingToEntities(
          targetIds,
          RelationQuerySource,
          field,
        );

        // listed once, although two of its embedded objects link to the target
        expect(new Map(ids(links) as [string, string[]][])).toEqual(
          new Map([
            [firstId, [embeddingFirst]],
            [lastId, [embeddingLast]],
          ]),
        );
        expect(loadType).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["a database query", true],
      ["the reference index of a local database", false],
    ])(
      "finds a single id still stored in a field that became an array, through %s",
      async (_name, supportsFind) => {
        const database = TestBed.inject(DatabaseResolverService).getDatabase();
        vi.spyOn(database, "supportsFind").mockReturnValue(supportsFind);
        // written directly, as saving through the current schema would store an array
        await database.put({
          _id: "RelationQuerySource:legacy",
          refArray: lastId,
        });

        const links = await service.loadLinkingToEntities(
          targetIds,
          RelationQuerySource,
          "refArray",
        );

        expect(ids(links)).toEqual([[lastId, ["RelationQuerySource:legacy"]]]);
      },
    );

    it.each<[string, () => Promise<Entity[]>]>([
      [
        "of one field for many entities",
        async () =>
          (
            await service.loadLinkingToEntities(
              targetIds,
              RelationQuerySource,
              "refScalar",
            )
          ).get(firstId),
      ],
      [
        "of all fields for one entity (e.g. for a cascading delete)",
        async () =>
          (await service.loadAllLinkingToEntity(targets[0])).map(
            ({ entity }) => entity,
          ),
      ],
    ])(
      "loads all records of the type when the lookup %s cannot query them",
      async (_name, lookUp) => {
        const linkingToFirst = await saveSource({ refScalar: firstId });
        await saveSource({ refScalar: lastId });
        vi.spyOn(entityMapper, "findAllType").mockRejectedValue(
          new Error("query failed"),
        );

        const linked = await lookUp();

        expect(linked.map((e) => e.getId())).toEqual([linkingToFirst]);
      },
    );
  });

  it("loads the whole type when one of its referencing fields cannot be queried", async () => {
    @DatabaseEntity("RelationQueryUnqueryableSource")
    class RelationQueryUnqueryableSource extends Entity {
      // a datatype that does not know how to query its stored format
      @DatabaseField({ dataType: "string", additional: "RelationQueryTarget" })
      refViaUnqueryableDatatype: string;
    }
    const referencing = new RelationQueryUnqueryableSource();
    referencing.refViaUnqueryableDatatype = target.getId();
    await entityMapper.save(referencing);

    const loadType = vi.spyOn(entityMapper, "loadType");

    expect(await idsLinkingToTarget()).toEqual([referencing.getId()]);
    expect(loadType).toHaveBeenCalledWith(RelationQueryUnqueryableSource);
  });
});
