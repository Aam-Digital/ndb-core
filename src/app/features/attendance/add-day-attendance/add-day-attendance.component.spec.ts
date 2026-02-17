import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AddDayAttendanceComponent } from "./add-day-attendance.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { AttendanceService } from "../attendance.service";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("AddDayAttendanceComponent", () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getChildren",
    ]);
    mockChildrenService.getChildren.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [AddDayAttendanceComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        {
          provide: AttendanceService,
          useValue: { getEventsOnDate: () => Promise.resolve([]) },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDayAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should save event to db after finishing roll call", () => {
    component.event = Note.create(new Date());
    const saveEntitySpy = spyOn(TestBed.inject(EntityMapperService), "save");

    component.saveRollCallResult(component.event);

    expect(saveEntitySpy).toHaveBeenCalledWith(component.event);
  });
});
