import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ChildrenService } from "../../../children/children.service";
import { EntityModule } from "../../../../core/entity/entity.module";
import { RouterTestingModule } from "@angular/router/testing";
import { NotesDashboardComponent } from "./notes-dashboard.component";
import { ChildrenModule } from "../../../children/children.module";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

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
        imports: [
          ChildrenModule,
          RouterTestingModule.withRoutes([]),
          EntityModule,
          Angulartics2Module.forRoot(),
          FontAwesomeTestingModule,
        ],
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

      expect(component.concernedChildren.length).toBe(3);

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

      expect(component.concernedChildren.length).toBe(1);

      expect(component.concernedChildren[0].childId).toBe(childId1);
      expect(component.concernedChildren[0].moreThanDaysSince).toBe(true);
      expect(component.concernedChildren[0].daysSinceLastNote).toBeLessThan(
        Number.POSITIVE_INFINITY
      );
    }));
  });
});
