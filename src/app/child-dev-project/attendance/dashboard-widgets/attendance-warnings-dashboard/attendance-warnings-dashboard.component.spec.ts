import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWarningsDashboardComponent } from "./attendance-warnings-dashboard.component";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildrenService } from "../../../children/children.service";
import { SchoolBlockComponent } from "../../../schools/school-block/school-block.component";
import { of } from "rxjs";
import { Child } from "../../../children/model/child";
import { ChildBlockComponent } from "../../../children/child-block/child-block.component";

describe("AttendanceWarningsDashboardComponent", () => {
  let component: AttendanceWarningsDashboardComponent;
  let fixture: ComponentFixture<AttendanceWarningsDashboardComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  const mockAttendanceLastMonth = {
    rows: [
      { key: "1", value: { sum: 10, count: 12 } },
      { key: "2", value: { sum: 12, count: 12 } },
    ],
  };

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
        "queryAttendanceLastMonth",
        "getChild",
      ]);
      mockChildrenService.queryAttendanceLastMonth.and.returnValue(
        Promise.resolve(mockAttendanceLastMonth)
      );
      mockChildrenService.getChild.and.returnValue(of(new Child("")));

      TestBed.configureTestingModule({
        declarations: [
          ChildBlockComponent,
          SchoolBlockComponent,
          AttendanceWarningsDashboardComponent,
        ],
        imports: [MatIconModule, MatCardModule, RouterTestingModule],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceWarningsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await component.ngOnInit();
    expect(component).toBeTruthy();
  });
});
