import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { ChildrenService } from "../../../children/children.service";
import { Database } from "../../../../core/database/database";
import { MockDatabase } from "../../../../core/database/mock-database";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildPhotoService } from "../../../children/child-photo-service/child-photo.service";
import { AttendanceModule } from "../../attendance.module";

describe("AttendanceWeekDashboardComponent", () => {
  let component: AttendanceWeekDashboardComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AttendanceModule, RouterTestingModule.withRoutes([])],
        providers: [
          { provide: ChildrenService, useClass: ChildrenService },
          { provide: Database, useClass: MockDatabase },
          {
            provide: ChildPhotoService,
            useValue: jasmine.createSpyObj(["getImage"]),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceWeekDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
