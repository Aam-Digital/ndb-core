import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { AttendanceAverageDashboardComponent } from "./attendance-average-dashboard.component";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { ChildrenService } from "../../../children/children.service";
import { RouterTestingModule } from "@angular/router/testing";
import { SchoolBlockComponent } from "../../../schools/school-block/school-block.component";
import { of } from "rxjs";
import { Child } from "../../../children/model/child";
import { ChildBlockComponent } from "../../../children/child-block/child-block.component";

describe("AttendanceAverageDashboardComponent", () => {
  let component: AttendanceAverageDashboardComponent;
  let fixture: ComponentFixture<AttendanceAverageDashboardComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const mockAttendanceLastMonth = {
    rows: [
      { key: "1", value: { sum: 10, count: 12 } },
      { key: "2", value: { sum: 12, count: 12 } },
    ],
  };
  const mockAttendanceLast3Months = {
    rows: [
      { key: "1", value: { sum: 15, count: 30 } },
      { key: "2", value: { sum: 15, count: 35 } },
    ],
  };
  const testChild = new Child("1");

  beforeEach(async(() => {
    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "queryAttendanceLastMonth",
      "queryAttendanceLast3Months",
      "getChild",
    ]);
    mockChildrenService.queryAttendanceLastMonth.and.returnValue(
      Promise.resolve(mockAttendanceLastMonth)
    );
    mockChildrenService.queryAttendanceLast3Months.and.returnValue(
      Promise.resolve(mockAttendanceLast3Months)
    );
    mockChildrenService.getChild.and.returnValue(of(testChild));

    TestBed.configureTestingModule({
      declarations: [
        ChildBlockComponent,
        SchoolBlockComponent,
        AttendanceAverageDashboardComponent,
      ],
      imports: [MatIconModule, MatCardModule, RouterTestingModule],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceAverageDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await component.ngOnInit();
    expect(component).toBeTruthy();
  });
});
