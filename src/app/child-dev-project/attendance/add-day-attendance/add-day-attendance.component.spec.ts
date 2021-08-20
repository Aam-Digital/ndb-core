import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AddDayAttendanceComponent } from "./add-day-attendance.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../../notes/model/note";
import { AttendanceModule } from "../attendance.module";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildrenService } from "../../children/children.service";
import { of } from "rxjs";
import { MatNativeDateModule } from "@angular/material/core";
import { AttendanceService } from "../attendance.service";
import { MockSessionModule } from "../../../core/session/mock-session.module";

describe("AddDayAttendanceComponent", () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
        "getChildren",
      ]);
      mockChildrenService.getChildren.and.returnValue(of([]));

      TestBed.configureTestingModule({
        imports: [
          AttendanceModule,
          RouterTestingModule,
          MatNativeDateModule,
          MockSessionModule.withState(),
        ],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          {
            provide: AttendanceService,
            useValue: { getEventsOnDate: () => Promise.resolve([]) },
          },
        ],
      }).compileComponents();
    })
  );

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
