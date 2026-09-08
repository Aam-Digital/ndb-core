import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ImportantNotesDashboardComponent } from "./important-notes-dashboard.component";
import { ImportantNotesIndexService } from "./important-notes-index.service";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { ConfigurableEnum } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum";
import type { Mock } from "vitest";

type ImportantNotesIndexServiceMock = Pick<
  ImportantNotesIndexService,
  "buildIndex" | "queryIndex"
> & {
  buildIndex: Mock<ImportantNotesIndexService["buildIndex"]>;
  queryIndex: Mock<ImportantNotesIndexService["queryIndex"]>;
};

describe("ImportantNotesDashboardComponent", () => {
  let component: ImportantNotesDashboardComponent;
  let fixture: ComponentFixture<ImportantNotesDashboardComponent>;
  let mockIndexService: ImportantNotesIndexServiceMock;

  beforeEach(waitForAsync(() => {
    mockIndexService = {
      buildIndex: vi.fn().mockName("mockIndexService.buildIndex"),
      queryIndex: vi.fn().mockName("mockIndexService.queryIndex"),
    };
    mockIndexService.buildIndex.mockResolvedValue(undefined);
    mockIndexService.queryIndex.mockResolvedValue([]);

    TestBed.configureTestingModule({
      imports: [
        ImportantNotesDashboardComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: ImportantNotesIndexService, useValue: mockIndexService },
        { provide: FormDialogService, useValue: { openView: vi.fn() } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportantNotesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should build the index for the configured warning levels", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT", "WARNING"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockIndexService.buildIndex).toHaveBeenLastCalledWith([
        "URGENT",
        "WARNING",
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should expose the notes returned by the index (already filtered and sorted)", async () => {
    vi.useFakeTimers();
    try {
      const notes = [Note.create(new Date(), "Note A")];
      mockIndexService.queryIndex.mockResolvedValue(notes);

      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockIndexService.queryIndex).toHaveBeenLastCalledWith(["URGENT"]);
      expect(component.notes()).toEqual(notes);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should query the index only once it has finished building", async () => {
    vi.useFakeTimers();
    try {
      let resolveBuild: () => void;
      mockIndexService.buildIndex.mockReturnValue(
        new Promise((resolve) => {
          resolveBuild = () => resolve(undefined);
        }),
      );
      mockIndexService.buildIndex.mockClear();
      mockIndexService.queryIndex.mockClear();

      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockIndexService.buildIndex).toHaveBeenCalledWith(["URGENT"]);
      expect(mockIndexService.queryIndex).not.toHaveBeenCalled(); // still building

      resolveBuild();
      await vi.advanceTimersByTimeAsync(0);
      expect(mockIndexService.queryIndex).toHaveBeenCalledWith(["URGENT"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should rebuild and re-query the index when warningLevels changes", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      mockIndexService.buildIndex.mockClear();
      mockIndexService.queryIndex.mockClear();

      fixture.componentRef.setInput("warningLevels", ["WARNING"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockIndexService.buildIndex).toHaveBeenCalledWith(["WARNING"]);
      expect(mockIndexService.queryIndex).toHaveBeenCalledWith(["WARNING"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should re-query the index when a Note changes", async () => {
    // Regression test: Notes are typically created progressively (e.g. during initial
    // sync/demo-data generation), so the first query can legitimately be empty/partial -
    // nothing else would trigger a refresh once matching Notes arrive.
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      mockIndexService.queryIndex.mockClear();

      const entityMapper = TestBed.inject(EntityMapperService);
      await entityMapper.save(Note.create(new Date(), "New urgent note"));
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockIndexService.queryIndex).toHaveBeenCalledWith(["URGENT"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should rebuild the index when the warning-levels enum config changes", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      mockIndexService.buildIndex.mockClear();

      const entityMapper = TestBed.inject(EntityMapperService);
      await entityMapper.save(new ConfigurableEnum("warning-levels"));
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockIndexService.buildIndex).toHaveBeenCalledWith(["URGENT"]);
    } finally {
      vi.useRealTimers();
    }
  });
});
