import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { NotesService } from "../../notes.service";
import { NotesDashboardComponent } from "./notes-dashboard.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { Entity } from "../../../../core/entity/model/entity";
import type { Mock } from "vitest";

type NotesServiceMock = Pick<
  NotesService,
  "getDaysSinceLastNoteOfEachEntity"
> & {
  getDaysSinceLastNoteOfEachEntity: Mock<
    NotesService["getDaysSinceLastNoteOfEachEntity"]
  >;
};

class Child extends Entity {
  static override ENTITY_TYPE = "Child";
}

describe("NotesDashboardComponent", () => {
  let component: NotesDashboardComponent;
  let fixture: ComponentFixture<NotesDashboardComponent>;

  let mockNotesService: NotesServiceMock;

  beforeEach(waitForAsync(() => {
    mockNotesService = {
      getDaysSinceLastNoteOfEachEntity: vi
        .fn()
        .mockName("mockNotesService.getDaysSinceLastNoteOfEachEntity"),
    };
    mockNotesService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
      new Map(),
    );

    TestBed.configureTestingModule({
      imports: [NotesDashboardComponent, MockedTestingModule.withState()],
      providers: [{ provide: NotesService, useValue: mockNotesService }],
    }).compileComponents();

    TestBed.inject(EntityRegistry).set("Child", Child);
  }));

  describe("with recent notes", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(NotesDashboardComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("entityType", "Child");
      fixture.componentRef.setInput("mode", "with-recent-notes");
      fixture.detectChanges();
    });

    it("should only count children with recent note", async () => {
      vi.useFakeTimers();
      try {
        mockNotesService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
          new Map([
            ["1", 2],
            ["2", 29],
            ["3", 30],
            ["4", 31],
            ["5", Number.POSITIVE_INFINITY],
          ]),
        );

        fixture.componentRef.setInput("sinceDays", 30);
        fixture.componentRef.setInput("fromBeginningOfWeek", false);
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        expect(component.entries()).toHaveLength(3);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("without recent notes", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(NotesDashboardComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("entityType", "Child");
      fixture.componentRef.setInput("mode", "without-recent-notes");
      fixture.detectChanges();
    });

    it("should add only children without recent note", async () => {
      vi.useFakeTimers();
      try {
        mockNotesService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
          new Map([
            ["1", 2],
            ["2", 29],
            ["3", 30],
            ["4", 31],
            ["5", 50],
          ]),
        );

        fixture.componentRef.setInput("sinceDays", 30);
        fixture.componentRef.setInput("fromBeginningOfWeek", false);
        fixture.detectChanges();

        await vi.advanceTimersByTimeAsync(0);

        expect(component.entries()).toHaveLength(3);

        expect(component.entries()[0]).toEqual({
          entityId: "5",
          daysSinceLastNote: 50,
          moreThanDaysSince: false,
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it("should mark children without stats on last note", async () => {
      vi.useFakeTimers();
      try {
        const childId1 = "1";
        mockNotesService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
          new Map([[childId1, Number.POSITIVE_INFINITY]]),
        );

        fixture.componentRef.setInput("sinceDays", 10);
        fixture.componentRef.setInput("fromBeginningOfWeek", false);
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        expect(component.entries()).toHaveLength(1);

        expect(component.entries()[0]).toEqual(
          expect.objectContaining({
            entityId: childId1,
            moreThanDaysSince: true,
          }),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it("should not load anything if no entity is configured", () => {
      fixture = TestBed.createComponent(NotesDashboardComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput("mode", "with-recent-notes");
      mockNotesService.getDaysSinceLastNoteOfEachEntity.mockClear();
      fixture.detectChanges();

      expect(
        mockNotesService.getDaysSinceLastNoteOfEachEntity,
      ).not.toHaveBeenCalled();
      expect(component.subtitle()).toBe("");
    });

    it("should not load anything if the configured entity type does not exist", () => {
      mockNotesService.getDaysSinceLastNoteOfEachEntity.mockClear();

      fixture.componentRef.setInput("entityType", "RemovedType");
      fixture.detectChanges();

      expect(
        mockNotesService.getDaysSinceLastNoteOfEachEntity,
      ).not.toHaveBeenCalled();
      expect(component.subtitle()).toBe("");
    });

    it("should load notes related to the configured entity", () => {
      mockNotesService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
        new Map(),
      );
      const entity = TestEntity.ENTITY_TYPE;

      fixture.componentRef.setInput("entityType", entity);
      fixture.componentRef.setInput("mode", "with-recent-notes");
      fixture.detectChanges();

      expect(
        mockNotesService.getDaysSinceLastNoteOfEachEntity,
      ).toHaveBeenCalledWith(entity, expect.anything());
    });
  });
});
