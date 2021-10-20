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
import { NoRecentNotesDashboardComponent } from "./no-recent-notes-dashboard.component";
import { ChildrenModule } from "../../../children/children.module";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("NoRecentNotesDashboardComponent", () => {
  let component: NoRecentNotesDashboardComponent;
  let fixture: ComponentFixture<NoRecentNotesDashboardComponent>;

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

  beforeEach(() => {
    fixture = TestBed.createComponent(NoRecentNotesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", fakeAsync(() => {
    expect(component).toBeTruthy();
    tick();
  }));

  it("should add only children without recent note", async () => {
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
    await component.ngOnInit();

    expect(component.concernedChildren.length).toBe(3);

    expect(component.concernedChildren[0]).toEqual({
      childId: "5",
      daysSinceLastNote: 50,
      moreThanDaysSince: false,
    });
  });

  it("should mark children without stats on last note", async () => {
    const childId1 = "1";
    mockChildrenService.getDaysSinceLastNoteOfEachChild.and.resolveTo(
      new Map([[childId1, Number.POSITIVE_INFINITY]])
    );

    await component.ngOnInit();

    expect(component.concernedChildren.length).toBe(1);

    expect(component.concernedChildren[0].childId).toBe(childId1);
    expect(component.concernedChildren[0].moreThanDaysSince).toBe(true);
    expect(component.concernedChildren[0].daysSinceLastNote).toBeLessThan(
      Number.POSITIVE_INFINITY
    );
  });
});
