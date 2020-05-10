import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceDaysComponent } from './attendance-days.component';
import { Database } from '../../../core/database/database';
import { MockDatabase } from '../../../core/database/mock-database';
import { AttendanceMonth } from '../model/attendance-month';
import { ChildrenModule } from '../../children/children.module';

describe('AttendanceDaysComponent', () => {
  let component: AttendanceDaysComponent;
  let fixture: ComponentFixture<AttendanceDaysComponent>;

  let attendanceMonth: AttendanceMonth;


  beforeEach(async(() => {
    attendanceMonth = new AttendanceMonth('');
    attendanceMonth.month = new Date('2018-01-01');

    TestBed.configureTestingModule({
      imports: [
        ChildrenModule,
      ],
      providers: [
        { provide: Database, useClass: MockDatabase },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDaysComponent);
    component = fixture.componentInstance;
    component.attendanceMonth = attendanceMonth;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
