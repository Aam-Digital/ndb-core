import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ChildrenService } from "../../../children/children.service";
import { NotesDashboardComponent } from "./notes-dashboard.component";
import { ChildrenModule } from "../../../children/children.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("NotesDashboardComponent", () => {
  let component: NotesDashboardComponent;
  let fixture: ComponentFixture<NotesDashboardComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
        "getDaysSinceLastNoteOfEachChild",
      ]);
      mockChildrenService.getDaysSinceLastNoteOfEachChild.and.resolveTo(
        new Map()
      );

      TestBed.configureTestingModule({
        imports: [ChildrenModule, MockedTestingModule.withState()],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

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

    it("should only count children with recent note", fakeAsync(() => {
      mockChildrenService.getDaysSinceLastNoteOfEachChild.and.resolveTo(
        new Map([
          ["1", 2],
          ["2", 29],
          ["3", 30],
          ["4", 31],
          ["5", Number.POSITIVE_INFINITY],
        ])
      );

      component.sinceDays = 30;
      component.fromBeginningOfWeek = false;
      component.ngOnInit();
      tick();

      expect(component.concernedChildren).toHaveSize(3);
    }));
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

    it("should add only children without recent note", fakeAsync(() => {
      mockChildrenService.getDaysSinceLastNoteOfEachChild.and.resolveTo(
        new Map([
          ["1", 2],
          ["2", 29],
          ["3", 30],
          ["4", 31],
          ["5", 50],
        ])
      );

      component.sinceDays = 30;
      component.fromBeginningOfWeek = false;
      component.ngOnInit();

      tick();

      expect(component.concernedChildren).toHaveSize(3);

      expect(component.concernedChildren[0]).toEqual({
        childId: "5",
        daysSinceLastNote: 50,
        moreThanDaysSince: false,
      });
    }));

    it("should mark children without stats on last note", fakeAsync(() => {
      const childId1 = "1";
      mockChildrenService.getDaysSinceLastNoteOfEachChild.and.resolveTo(
        new Map([[childId1, Number.POSITIVE_INFINITY]])
      );

      component.ngOnInit();
      tick();

      expect(component.concernedChildren).toHaveSize(1);

      expect(component.concernedChildren[0].childId).toBe(childId1);
      expect(component.concernedChildren[0].moreThanDaysSince).toBeTrue();
      expect(component.concernedChildren[0].daysSinceLastNote).toBeFinite();
    }));
  });
});
