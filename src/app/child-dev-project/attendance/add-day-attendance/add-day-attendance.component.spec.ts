import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AddDayAttendanceComponent } from "./add-day-attendance.component";
import { MatNativeDateModule } from "@angular/material/core";
import { Child } from "../../children/model/child";
import { EventAttendance } from "../model/event-attendance";
import { EventNote } from "../model/event-note";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("AddDayAttendanceComponent", () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", ["save"]);
    mockEntityService.save.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatNativeDateModule,
        MatDialogModule,
        MatDatepickerModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatInputModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityService },
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

  it("should sort event participants by schoolClass of students", async () => {
    const testStudents = [
      new Child("0"),
      new Child("1"),
      new Child("2"),
      new Child("3"),
      new Child("4"),
    ];
    testStudents[0].schoolClass = "10";
    testStudents[1].schoolClass = "9";
    testStudents[2].schoolClass = "KG";
    testStudents[3].schoolClass = undefined;
    testStudents[4].schoolClass = "9";

    component.attendanceType = "coaching";
    component.day = new Date();

    component.finishStudentSelectionStage(testStudents);

    const actualStudentClassOrder = component.event.children.map(
      (childAttendance: EventAttendance) => {
        const child = testStudents.find(
          (c) => c.getId() === childAttendance.childId
        );
        return child.schoolClass;
      }
    );
    const expectedStudentClassOrder = ["9", "9", "10", "KG", undefined];
    expect(actualStudentClassOrder).toEqual(expectedStudentClassOrder);
  });

  it("should create new event note if none exists", () => {
    const testStudents = [new Child("0")];
    component.attendanceType = "coaching";
    component.day = new Date();

    component.finishStudentSelectionStage(testStudents);

    expect(component.event).toBeDefined();
    expect(component.event.date).toEqual(component.day);
    expect(component.event.children).toEqual(
      testStudents.map((c) => new EventAttendance(c.getId()))
    );
    expect(component.event.activity).toEqual(component.attendanceType);
  });

  it("should save event to db after finishing roll call", () => {
    component.event = EventNote.create(new Date());

    component.finishRollCallState();

    expect(mockEntityService.save).toHaveBeenCalledWith(component.event);
  });
});
