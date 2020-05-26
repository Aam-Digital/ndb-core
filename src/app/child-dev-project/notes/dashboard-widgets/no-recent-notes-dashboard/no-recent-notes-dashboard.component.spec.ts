import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ChildrenService } from "../../../children/children.service";
import { EntityModule } from "../../../../core/entity/entity.module";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildPhotoService } from "../../../children/child-photo-service/child-photo.service";
import { NoRecentNotesDashboardComponent } from "./no-recent-notes-dashboard.component";
import { of } from "rxjs";
import { Child } from "../../../children/model/child";
import { ChildrenModule } from "../../../children/children.module";

describe("RecentNotesDashboardComponent", () => {
  let component: NoRecentNotesDashboardComponent;
  let fixture: ComponentFixture<NoRecentNotesDashboardComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(async(() => {
    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getChildren",
      "getDaysSinceLastNoteOfEachChild",
    ]);
    mockChildrenService.getChildren.and.returnValue(of([]));
    mockChildrenService.getDaysSinceLastNoteOfEachChild.and.returnValue(
      Promise.resolve(new Map())
    );

    TestBed.configureTestingModule({
      imports: [
        ChildrenModule,
        RouterTestingModule.withRoutes([]),
        EntityModule,
      ],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        {
          provide: ChildPhotoService,
          useValue: jasmine.createSpyObj(["getImage"]),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoRecentNotesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", fakeAsync(() => {
    expect(component).toBeTruthy();
    tick();
  }));

  it("should add all children without note", fakeAsync(() => {
    const mockChildren = [new Child("1"), new Child("2")];
    mockChildrenService.getChildren.and.returnValue(of(mockChildren));

    component.ngOnInit();
    tick();

    expect(component.concernedChildren.length).toBe(2);
  }));
});
