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
import { SessionService } from "../../../core/session/session-service/session.service";

describe("AddDayAttendanceComponent", () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityService = jasmine.createSpyObj("mockEntityService", [
        "save",
        "loadType",
      ]);
      mockEntityService.save.and.resolveTo();
      mockEntityService.loadType.and.resolveTo([]);

      mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
        "getChildren",
      ]);
      mockChildrenService.getChildren.and.returnValue(of([]));

      mockSessionService = jasmine.createSpyObj(["getCurrentDBUser"]);

      TestBed.configureTestingModule({
        imports: [AttendanceModule, RouterTestingModule, MatNativeDateModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityService },
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: SessionService, useValue: mockSessionService },
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

    component.saveRollCallResult(component.event);

    expect(mockEntityService.save).toHaveBeenCalledWith(component.event);
  });
});
