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
import { RecentNotesDashboardComponent } from "./recent-notes-dashboard.component";
import { ChildrenModule } from "../../../children/children.module";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("RecentNotesDashboardComponent", () => {
  let component: RecentNotesDashboardComponent;
  let fixture: ComponentFixture<RecentNotesDashboardComponent>;

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
    fixture = TestBed.createComponent(RecentNotesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", fakeAsync(() => {
    expect(component).toBeTruthy();
    tick();
  }));

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

    expect(component.count).toBe(3);
  }));
});
