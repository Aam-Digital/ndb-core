import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AddDayAttendanceComponent } from "./add-day-attendance.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../../notes/model/note";
import { AttendanceModule } from "../attendance.module";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildrenService } from "../../children/children.service";
import { of } from "rxjs";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { MatNativeDateModule } from "@angular/material/core";
import { AttendanceService } from "../attendance.service";

describe("AddDayAttendanceComponent", () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(async(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", ["save"]);
    mockEntityService.save.and.resolveTo();

    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getChildren",
    ]);
    mockChildrenService.getChildren.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AttendanceModule, RouterTestingModule, MatNativeDateModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityService },
        { provide: ChildrenService, useValue: mockChildrenService },
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User("") },
        },
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

    component.finishRollCallState();

    expect(mockEntityService.save).toHaveBeenCalledWith(component.event);
  });
});
