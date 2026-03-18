import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildrenService } from "../../../children/children.service";
import { NotesDashboardComponent } from "./notes-dashboard.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { Entity } from "../../../../core/entity/model/entity";
import type { Mock } from "vitest";

type ChildrenServiceMock = Pick<
  ChildrenService,
  "getDaysSinceLastNoteOfEachEntity"
> & {
  getDaysSinceLastNoteOfEachEntity: Mock<
    ChildrenService["getDaysSinceLastNoteOfEachEntity"]
  >;
};

class Child extends Entity {
  static override ENTITY_TYPE = "Child";
}

describe("NotesDashboardComponent", () => {
  let component: NotesDashboardComponent;
  let fixture: ComponentFixture<NotesDashboardComponent>;

  let mockChildrenService: ChildrenServiceMock;

  beforeEach(waitForAsync(() => {
    mockChildrenService = {
      getDaysSinceLastNoteOfEachEntity: vi
        .fn()
        .mockName("mockChildrenService.getDaysSinceLastNoteOfEachEntity"),
    };
    mockChildrenService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
      new Map(),
    );

    TestBed.configureTestingModule({
      imports: [NotesDashboardComponent, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();

    TestBed.inject(EntityRegistry).set("Child", Child);
  }));

  describe("with recent notes", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(NotesDashboardComponent);
      component = fixture.componentInstance;
      component.mode = "with-recent-notes";
      fixture.detectChanges();
    });

    it("should create", () => {
      expect(component).toBeTruthy();
    });

    it("should only count children with recent note", async () => {
      vi.useFakeTimers();
      try {
        mockChildrenService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
          new Map([
            ["1", 2],
            ["2", 29],
            ["3", 30],
            ["4", 31],
            ["5", Number.POSITIVE_INFINITY],
          ]),
        );

        component.sinceDays = 30;
        component.fromBeginningOfWeek = false;
        component.ngOnInit();
        await vi.advanceTimersByTimeAsync(0);

        expect(component.entries).toHaveLength(3);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("without recent notes", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(NotesDashboardComponent);
      component = fixture.componentInstance;
      component.mode = "without-recent-notes";
      fixture.detectChanges();
    });

    it("should create", () => {
      expect(component).toBeTruthy();
    });

    it("should add only children without recent note", async () => {
      vi.useFakeTimers();
      try {
        mockChildrenService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
          new Map([
            ["1", 2],
            ["2", 29],
            ["3", 30],
            ["4", 31],
            ["5", 50],
          ]),
        );

        component.sinceDays = 30;
        component.fromBeginningOfWeek = false;
        component.ngOnInit();

        await vi.advanceTimersByTimeAsync(0);

        expect(component.entries).toHaveLength(3);

        expect(component.entries[0]).toEqual({
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
        mockChildrenService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
          new Map([[childId1, Number.POSITIVE_INFINITY]]),
        );

        component.sinceDays = 10;
        component.fromBeginningOfWeek = false;
        component.ngOnInit();
        await vi.advanceTimersByTimeAsync(0);

        expect(component.entries).toHaveLength(1);

        expect(component.entries[0]).toEqual(
          expect.objectContaining({
            entityId: childId1,
            moreThanDaysSince: true,
          }),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it("should load notes related to the configured entity", () => {
      mockChildrenService.getDaysSinceLastNoteOfEachEntity.mockResolvedValue(
        new Map(),
      );
      const entity = TestEntity.ENTITY_TYPE;

      component.entity = entity;
      component.mode = "with-recent-notes";
      component.ngOnInit();

      expect(
        mockChildrenService.getDaysSinceLastNoteOfEachEntity,
      ).toHaveBeenCalledWith(entity, expect.anything());
    });
  });
});
