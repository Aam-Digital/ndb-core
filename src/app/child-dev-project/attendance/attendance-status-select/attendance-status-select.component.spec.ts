import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceStatusSelectComponent } from "./attendance-status-select.component";
import { AttendanceModule } from "../attendance.module";

describe("AttendanceStatusSelectComponent", () => {
  let component: AttendanceStatusSelectComponent;
  let fixture: ComponentFixture<AttendanceStatusSelectComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AttendanceModule],
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
