import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceStatusSelectComponent } from "./attendance-status-select.component";

describe("AttendanceStatusSelectComponent", () => {
  let component: AttendanceStatusSelectComponent;
  let fixture: ComponentFixture<AttendanceStatusSelectComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AttendanceStatusSelectComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceStatusSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
