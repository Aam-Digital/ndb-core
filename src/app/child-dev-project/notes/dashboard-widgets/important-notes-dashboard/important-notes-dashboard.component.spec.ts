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

  it("should query the index with the requested skip/limit once built", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const notes = [Note.create(new Date(), "Note A")];
      mockIndexService.queryIndex.mockResolvedValue(notes);

      const page = await component.pageLoader()(10, 6);

      expect(mockIndexService.queryIndex).toHaveBeenLastCalledWith(
        ["URGENT"],
        10,
        6,
      );
      expect(page).toEqual(notes);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should wait for the index to be built before querying it", async () => {
    vi.useFakeTimers();
    try {
      let resolveBuild: () => void;
      mockIndexService.buildIndex.mockReturnValue(
        new Promise((resolve) => {
          resolveBuild = () => resolve(undefined);
        }),
      );
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      let resolved = false;
      const loadPromise = component
        .pageLoader()(0, 6)
        .then(() => (resolved = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false); // still waiting on buildIndex

      resolveBuild();
      await loadPromise;
      expect(resolved).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should produce a new pageLoader (so the widget restarts from page 0) when warningLevels changes", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      const firstLoader = component.pageLoader();

      fixture.componentRef.setInput("warningLevels", ["WARNING"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      const secondLoader = component.pageLoader();

      expect(secondLoader).not.toBe(firstLoader);
      expect(mockIndexService.buildIndex).toHaveBeenLastCalledWith(["WARNING"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should produce a new pageLoader (so the widget re-fetches) when a relevant Note changes", async () => {
    // Regression test: Notes are typically created progressively (e.g. during initial
    // sync/demo-data generation), so the widget's first fetch can legitimately be
    // empty/partial - nothing else would trigger a retry once matching Notes arrive.
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      const firstLoader = component.pageLoader();

      const entityMapper = TestBed.inject(EntityMapperService);
      await entityMapper.save(Note.create(new Date(), "New urgent note"));
      await vi.advanceTimersByTimeAsync(300);

      const secondLoader = component.pageLoader();
      expect(secondLoader).not.toBe(firstLoader);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should produce a new pageLoader (so the widget rebuilds) when the warning-levels enum config changes", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("warningLevels", ["URGENT"]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      const buildCountBefore = mockIndexService.buildIndex.mock.calls.length;
      const firstLoader = component.pageLoader();

      const entityMapper = TestBed.inject(EntityMapperService);
      await entityMapper.save(new ConfigurableEnum("warning-levels"));
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      const secondLoader = component.pageLoader();
      expect(secondLoader).not.toBe(firstLoader);
      expect(mockIndexService.buildIndex.mock.calls.length).toBe(
        buildCountBefore + 1,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
