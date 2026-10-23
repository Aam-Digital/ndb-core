import { TestBed } from "@angular/core/testing";
import moment from "moment";
import { NotesService } from "./notes.service";
import { Note } from "./model/note";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { DatabaseTestingModule } from "../../utils/database-testing.module";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { createEntityOfType } from "../../core/demo-data/create-entity-of-type";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { expectArrayWithExactContents } from "../../utils/test-utils/array-test-utils";
import { EntityConfigReadyService } from "../../core/entity/entity-config-ready.service";

describe("NotesService", () => {
  let service: NotesService;
  let entityMapper: EntityMapperService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
      providers: [EntitySchemaService],
    });

    await vi.waitFor(
      () => {
        const entityRegistry = TestBed.inject(EntityRegistry);
        expect(entityRegistry.has("Child")).toBe(true);
        expect(entityRegistry.has("School")).toBe(true);
      },
      { timeout: 10_000 },
    );

    entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([
      createEntityOfType("Child", "1"),
      createEntityOfType("Child", "2"),
      createEntityOfType("School", "1"),
      createEntityOfType("School", "2"),
    ]);

    service = TestBed.inject(NotesService);
  });

  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());

  it("calculates days since last note for children", async () => {
    const allChildren = await entityMapper.loadType("Child");

    const c0 = allChildren[0].getId();
    await entityMapper.save(
      Note.create(moment().subtract(5, "days").toDate(), "n0-1", [c0]),
    );
    await entityMapper.save(
      Note.create(moment().subtract(8, "days").toDate(), "n0-2", [c0]),
    );

    const c1 = allChildren[1].getId();
    // no notes

    const recentNotesMap =
      await service.getDaysSinceLastNoteOfEachEntity("Child");

    expect(recentNotesMap.size).toBe(allChildren.length);
    expect(recentNotesMap.get(c0)).toBe(5);
    expect(recentNotesMap.get(c1)).toBe(Infinity);
  });

  it("calculates days since last note as infinity if above cut-off period for better performance", async () => {
    const allChildren = await entityMapper.loadType("Child");

    const c0 = allChildren[0].getId();
    await entityMapper.save(
      Note.create(moment().subtract(50, "days").toDate(), "n0-1", [c0]),
    );

    const recentNotesMap = await service.getDaysSinceLastNoteOfEachEntity(
      "Child",
      49,
    );

    expect(recentNotesMap.get(c0)).toBe(Infinity);
  });

  it("should calculate days since last note for other entity types", async () => {
    const schools = await entityMapper.loadType("School");
    const s1 = schools[0];
    const s2 = schools[1];
    const n1 = Note.create(moment().subtract(10, "days").toDate(), "", [
      s1.getId(),
      s2.getId(),
    ]);
    const n2 = Note.create(moment().subtract(2, "days").toDate(), "", [
      s1.getId(),
    ]);
    await entityMapper.saveAll([n1, n2]);

    const recentNotesMap =
      await service.getDaysSinceLastNoteOfEachEntity("School");

    expect(recentNotesMap.get(s1.getId())).toBe(2);
    expect(recentNotesMap.get(s2.getId())).toBe(10);
  });

  it("should return related notes", async () => {
    const c1 = createEntityOfType("Child", "c1");
    const c2 = createEntityOfType("Child", "c2");
    const s1 = createEntityOfType("School", "s1");
    const s2 = createEntityOfType("School", "s2");
    const n1 = new Note("n1");
    n1.relatedEntities = [c1.getId(), c2.getId(), s1.getId()];
    const n2 = new Note("n2");
    n2.relatedEntities = [c1.getId()];
    const n3 = new Note("n3");
    n3.relatedEntities = [s2.getId()];
    await entityMapper.saveAll([n1, n2, n3]);

    let res = await service.getNotesRelatedTo(c1.getId());
    expect(res).toEqual([n1, n2]);

    res = await service.getNotesRelatedTo(s1.getId());
    expect(res).toEqual([n1]);

    res = await service.getNotesRelatedTo(s2.getId());
    expect(res).toEqual([n3]);
  });

  it("should return notes related through any entity field of Note", async () => {
    Note.schema.set("linkedSchool", {
      dataType: "entity",
      additional: "School",
    });
    try {
      // wait for the initial index creation, then signal the extended schema (as applying the config does)
      await service.getNotesRelatedTo("School:none");
      TestBed.inject(EntityConfigReadyService).markSetupCompleted();
      const s1 = createEntityOfType("School", "s1");
      const linkedOnce = new Note("n1");
      linkedOnce["linkedSchool"] = s1.getId();
      // linked through multiple fields, but should be returned only once
      const linkedTwice = new Note("n2");
      linkedTwice["linkedSchool"] = s1.getId();
      linkedTwice.relatedEntities = [s1.getId()];
      await entityMapper.saveAll([linkedOnce, linkedTwice]);

      const res = await service.getNotesRelatedTo(s1.getId());
      expectArrayWithExactContents(
        res.map((n) => n.getId()),
        [linkedOnce.getId(), linkedTwice.getId()],
      );
    } finally {
      Note.schema.delete("linkedSchool");
    }
  });

  it("should not return notes only authored by the entity", async () => {
    const user = createEntityOfType("User", "u1");
    const note = new Note("n1");
    note.authors = [user.getId()];
    await entityMapper.save(note);

    expect(await service.getNotesRelatedTo(user.getId())).toEqual([]);
  });

  it("should not count notes only authored by the entity as its recent notes", async () => {
    const user = createEntityOfType("User", "u1");
    const note = Note.create(moment().subtract(2, "days").toDate());
    note.authors = [user.getId()];
    await entityMapper.saveAll([user, note]);

    const recentNotesMap =
      await service.getDaysSinceLastNoteOfEachEntity("User");

    expect(recentNotesMap.get(user.getId())).toBe(Infinity);
  });

  it("should return the correct notes in a timespan", async () => {
    const n1 = Note.create(moment("2023-01-01").toDate());
    const n2 = Note.create(moment("2023-01-02").toDate());
    const n3 = Note.create(moment("2023-01-03").toDate());
    const n4 = Note.create(moment("2023-01-03").toDate());
    const n5 = Note.create(moment("2023-01-04").toDate());
    await entityMapper.saveAll([n1, n2, n3, n4, n5]);

    const res = await service.getNotesInTimespan(
      moment("2023-01-02"),
      moment("2023-01-03"),
    );
    expectArrayWithExactContents(res, [n2, n3, n4]);
  });
});
