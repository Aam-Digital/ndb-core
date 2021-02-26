import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AttendanceDayBlockComponent } from "../../attendance-days/attendance-day-block.component";
import { SchoolBlockComponent } from "../../../schools/school-block/school-block.component";
import { ChildrenService } from "../../../children/children.service";
import { EntityModule } from "../../../../core/entity/entity.module";
import { Database } from "../../../../core/database/database";
import { MockDatabase } from "../../../../core/database/mock-database";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildPhotoService } from "../../../children/child-photo-service/child-photo.service";
import { ChildBlockComponent } from "../../../children/child-block/child-block.component";

describe("AttendanceWeekDashboardComponent", () => {
  let component: AttendanceWeekDashboardComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [
          AttendanceWeekDashboardComponent,
          ChildBlockComponent,
          AttendanceDayBlockComponent,
          SchoolBlockComponent,
        ],
        imports: [
          MatIconModule,
          MatCardModule,
          MatTooltipModule,
          RouterTestingModule.withRoutes([]),
          EntityModule,
        ],
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
