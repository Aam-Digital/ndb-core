import { TestBed } from "@angular/core/testing";
import { firstValueFrom, Subject, Subscription } from "rxjs";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import {
  DuplicateDetectionService,
  DuplicatePair,
} from "./duplicate-detection.service";
import { Entity } from "../../core/entity/model/entity";
import { UpdatedEntity } from "../../core/entity/model/entity-update";

describe("DuplicateDetectionService", () => {
  let service: DuplicateDetectionService;
  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [...mockEntityMapperProvider()],
    });
    service = TestBed.inject(DuplicateDetectionService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  afterEach(() => vi.restoreAllMocks());

  /** the first result of a one-off analysis, as the previous `findDuplicates` returned */
  function findDuplicates(fields: string[]): Promise<DuplicatePair[]> {
    return firstValueFrom(service.watchDuplicates(TestEntity, fields));
  }

  describe("matching", () => {
    it.each([
      ["identical values", "Alice", "Alice", true],
      ["values differing only in case", "Alice", "alice", true],
      ["values differing only in surrounding space", " Alice ", "Alice", true],
      [
        "values differing only by Unicode whitespace",
        "Alice Smith",
        "Alice Smith",
        true,
      ],
      ["different values", "Alice", "Bob", false],
      ["empty values", "", "", false],
      ["missing values", undefined, undefined, false],
    ])("pairs records with %s: %s", async (_name, valueA, valueB, expected) => {
      entityMapper.addAll([
        TestEntity.create({ name: valueA }),
        TestEntity.create({ name: valueB }),
      ]);

      expect(await findDuplicates(["name"])).toHaveLength(expected ? 1 : 0);
    });

    it("pairs records only when all selected fields match", async () => {
      const a = TestEntity.create({ name: "Alice", other: "X" });
      const b = TestEntity.create({ name: "alice", other: "X" });
      const c = TestEntity.create({ name: "alice", other: "Y" });
      entityMapper.addAll([a, b, c]);

      const result = await findDuplicates(["name", "other"]);

      expect(result).toHaveLength(1);
      expect(result[0].record).toBe(a);
      expect(result[0].possibleDuplicate).toBe(b);
    });

    it("does not pair records whose values only combine to the same key", async () => {
      // a key joining the field values on a separator would make these collide
      entityMapper.addAll([
        TestEntity.create({ name: "a|b", other: "c" }),
        TestEntity.create({ name: "a", other: "b|c" }),
      ]);

      expect(await findDuplicates(["name", "other"])).toHaveLength(0);
    });

    it("pairs every further member of a group with the first record", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "alice" });
      const c = TestEntity.create({ name: "ALICE" });
      entityMapper.addAll([a, b, c]);

      const result = await findDuplicates(["name"]);

      expect(result).toEqual([
        { record: a, possibleDuplicate: b },
        { record: a, possibleDuplicate: c },
      ]);
    });

    it("returns no pairs without entities or without selected fields", async () => {
      expect(await findDuplicates(["name"])).toHaveLength(0);

      entityMapper.addAll([
        TestEntity.create({ name: "Alice" }),
        TestEntity.create({ name: "Alice" }),
      ]);
      expect(await findDuplicates([])).toHaveLength(0);
    });

    it("does not pair records by an object-valued field without an id", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "Alice" });
      a["metadata"] = { key: "A" };
      b["metadata"] = { key: "B" };
      entityMapper.addAll([a, b]);

      expect(await findDuplicates(["metadata"])).toHaveLength(0);
    });

    it("pairs records by the id of a configurable-enum value", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "Bob" });
      a["center"] = { id: "barabazar", label: "Barabazar" };
      b["center"] = { id: "barabazar", label: "Bara Bazar" };
      entityMapper.addAll([a, b]);

      const result = await findDuplicates(["center"]);

      expect(result).toEqual([{ record: a, possibleDuplicate: b }]);
    });
  });

  describe("keeping the analysis up to date", () => {
    let emitted: DuplicatePair[][];
    let subscription: Subscription;

    /** the pairs of the most recent emission */
    const latest = () => emitted[emitted.length - 1];

    function watch(fields = ["name"]) {
      emitted = [];
      subscription = service
        .watchDuplicates(TestEntity, fields)
        .subscribe((pairs) => emitted.push(pairs));
    }

    afterEach(() => subscription?.unsubscribe());

    /**
     * A removal reaches subscribers as a tombstone, carrying only the id.
     * Deliberately not `entityMapper.remove`, which publishes the full entity and would
     * let an implementation pass that recomputes the match key on removal.
     */
    async function removeFromDatabase(entity: Entity) {
      const tombstone = new TestEntity(entity.getId(true));
      (
        entityMapper.receiveUpdates(TestEntity) as Subject<
          UpdatedEntity<TestEntity>
        >
      ).next({ type: "remove", entity: tombstone });
      await Promise.resolve();
    }

    it("adds a pair when a matching record appears", async () => {
      const a = TestEntity.create({ name: "Alice" });
      entityMapper.addAll([a]);
      watch();
      await Promise.resolve();

      const b = TestEntity.create({ name: "alice" });
      await entityMapper.save(b);

      expect(latest()).toEqual([{ record: a, possibleDuplicate: b }]);
    });

    it("drops a pair when a record's value no longer matches", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "alice" });
      entityMapper.addAll([a, b]);
      watch();
      await Promise.resolve();
      expect(latest()).toHaveLength(1);

      b.name = "Bob";
      await entityMapper.save(b);

      expect(latest()).toHaveLength(0);
    });

    it("pairs the updated instance of a record, not the one loaded initially", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "alice" });
      entityMapper.addAll([a, b]);
      watch();
      await Promise.resolve();

      // same value, so the record stays in its group - but a merge started from the
      // list would save this instance, and a stale _rev would make that fail
      const updated = a.copy();
      updated["_rev"] = "2-updated";
      await entityMapper.save(updated);

      expect(latest()[0].record).toBe(updated);
    });

    it("drops a pair when a record is removed", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "alice" });
      entityMapper.addAll([a, b]);
      watch();
      await Promise.resolve();
      expect(latest()).toHaveLength(1);

      await removeFromDatabase(b);

      expect(latest()).toHaveLength(0);
    });

    it("re-pairs the remaining records when the paired-against record is removed", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "alice" });
      const c = TestEntity.create({ name: "ALICE" });
      entityMapper.addAll([a, b, c]);
      watch();
      await Promise.resolve();

      await removeFromDatabase(a);

      expect(latest()).toEqual([{ record: b, possibleDuplicate: c }]);
    });

    it("does not lose a change arriving while the initial load is still running", async () => {
      const a = TestEntity.create({ name: "Alice" });
      const b = TestEntity.create({ name: "alice" });
      let finishLoad: (entities: TestEntity[]) => void;
      vi.spyOn(entityMapper, "loadType").mockReturnValue(
        new Promise((resolve) => (finishLoad = resolve)),
      );
      watch();

      await entityMapper.save(b);
      finishLoad([a]);
      await Promise.resolve();
      await Promise.resolve();

      expect(latest()).toEqual([{ record: a, possibleDuplicate: b }]);
    });

    it("stops updating once unsubscribed", async () => {
      const a = TestEntity.create({ name: "Alice" });
      entityMapper.addAll([a]);
      watch();
      await Promise.resolve();
      const emissionsWhileSubscribed = emitted.length;

      subscription.unsubscribe();
      await entityMapper.save(TestEntity.create({ name: "alice" }));

      expect(emitted).toHaveLength(emissionsWhileSubscribed);
    });
  });
});
