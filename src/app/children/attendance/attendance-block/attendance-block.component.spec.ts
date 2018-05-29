import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceBlockComponent } from './attendance-block.component';
import {AttendanceMonth} from '../attendance-month';

describe('AttendanceBlockComponent', () => {
  let component: AttendanceBlockComponent;
  let fixture: ComponentFixture<AttendanceBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendanceBlockComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceBlockComponent);
    component = fixture.componentInstance;

    const attendanceRecord = new AttendanceMonth('101');
    attendanceRecord.student = '22';
    attendanceRecord.month = new Date('2018-01-01');
    attendanceRecord.daysAttended = 6;
    attendanceRecord.daysWorking = 10;
    attendanceRecord.daysExcused = 2;
    component.attendanceData = attendanceRecord;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
