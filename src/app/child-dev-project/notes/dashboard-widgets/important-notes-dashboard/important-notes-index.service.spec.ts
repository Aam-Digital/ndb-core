import { TestBed } from "@angular/core/testing";
import { ImportantNotesIndexService } from "./important-notes-index.service";
import { DatabaseTestingModule } from "#src/app/utils/database-testing.module";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { warningLevels } from "#src/app/child-dev-project/warning-level";
import { ConfigurableEnum } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";

describe("ImportantNotesIndexService", () => {
  let service: ImportantNotesIndexService;
  let entityMapper: EntityMapperService;

  const noteWithLevel = (levelId: string) => {
    const level = warningLevels.find((l) => l.id === levelId);
    const note = Note.create(new Date());
    note.warningLevel = level;
    return note;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    }).compileComponents();

    entityMapper = TestBed.inject(EntityMapperService);
    service = TestBed.inject(ImportantNotesIndexService);

    // seed the "warning-levels" enum config, since ordinals are looked up from it
    await entityMapper.save(
      new ConfigurableEnum("warning-levels", warningLevels),
    );
    await TestBed.inject(ConfigurableEnumService).preLoadEnums();
  });
  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should only return notes with a configured, relevant warning level", async () => {
    const urgentNote = noteWithLevel("URGENT");
    const warningNote = noteWithLevel("WARNING");
    const okNote = noteWithLevel("OK");
    await entityMapper.saveAll([urgentNote, warningNote, okNote]);

    await service.buildIndex(["URGENT", "WARNING"]);
    const data = await service.queryIndex(["URGENT", "WARNING"], 0, 10);

    expect(data.map((n) => n.getId())).toEqual(
      expect.arrayContaining([urgentNote.getId(), warningNote.getId()]),
    );
    expect(data).toHaveLength(2);
  });

  it("should sort notes with the highest warning level (most urgent) first", async () => {
    const urgentNote = noteWithLevel("URGENT");
    const warningNote = noteWithLevel("WARNING");
    // saved in reverse order of urgency, to prove the index - not insertion order - drives sorting
    await entityMapper.saveAll([warningNote, urgentNote]);

    await service.buildIndex(["URGENT", "WARNING"]);
    const data = await service.queryIndex(["URGENT", "WARNING"], 0, 10);

    expect(data.map((n) => n.getId())).toEqual([
      urgentNote.getId(),
      warningNote.getId(),
    ]);
  });

  it("should paginate results using skip and limit", async () => {
    const urgentNotes = Array.from({ length: 5 }, () => noteWithLevel("URGENT"));
    await entityMapper.saveAll(urgentNotes);

    await service.buildIndex(["URGENT"]);
    const firstPage = await service.queryIndex(["URGENT"], 0, 2);
    const secondPage = await service.queryIndex(["URGENT"], 2, 2);

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);
    const firstPageIds = firstPage.map((n) => n.getId());
    const secondPageIds = secondPage.map((n) => n.getId());
    expect(firstPageIds).not.toEqual(
      expect.arrayContaining(secondPageIds.slice(0, 1)),
    );
  });
});
