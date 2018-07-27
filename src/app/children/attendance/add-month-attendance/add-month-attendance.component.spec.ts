import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMonthAttendanceComponent } from './add-month-attendance.component';

describe('AddMonthAttendanceComponent', () => {
  let component: AddMonthAttendanceComponent;
  let fixture: ComponentFixture<AddMonthAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMonthAttendanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMonthAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
