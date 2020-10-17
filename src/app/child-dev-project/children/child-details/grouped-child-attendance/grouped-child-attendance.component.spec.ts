import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { GroupedChildAttendanceComponent } from "./grouped-child-attendance.component";

describe("GroupedChildAttendanceComponent", () => {
  let component: GroupedChildAttendanceComponent;
  let fixture: ComponentFixture<GroupedChildAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GroupedChildAttendanceComponent],
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
