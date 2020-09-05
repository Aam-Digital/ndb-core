import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceManagerComponent } from "./attendance-manager.component";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { RouterTestingModule } from "@angular/router/testing";

describe("AttendanceManagerComponent", () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AttendanceManagerComponent],
      imports: [MatButtonModule, MatCardModule, RouterTestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
