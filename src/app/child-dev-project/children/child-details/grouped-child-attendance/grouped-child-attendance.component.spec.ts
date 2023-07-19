import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GroupedChildAttendanceComponent } from "./grouped-child-attendance.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("GroupedChildAttendanceComponent", () => {
  let component: GroupedChildAttendanceComponent;
  let fixture: ComponentFixture<GroupedChildAttendanceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        GroupedChildAttendanceComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupedChildAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
