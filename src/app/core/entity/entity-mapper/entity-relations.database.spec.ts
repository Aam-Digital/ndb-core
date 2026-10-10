import { TestBed } from "@angular/core/testing";

import { EntityRelationsService } from "./entity-relations.service";
import { EntityMapperService } from "./entity-mapper.service";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { DatabaseEntity } from "../database-entity.decorator";
import { DatabaseField } from "../database-field.decorator";
import { Entity } from "../model/entity";

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
