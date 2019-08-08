import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceBlockComponent } from './attendance-block.component';
import {AttendanceMonth} from '../attendance-month';
import {AttendanceDaysComponent} from '../attendance-days/attendance-days.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {FormsModule} from '@angular/forms';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {EntityModule} from '../../../entity/entity.module';
import {AttendanceDayBlockComponent} from '../attendance-days/attendance-day-block.component';

describe('AttendanceBlockComponent', () => {
  let component: AttendanceBlockComponent;
  let fixture: ComponentFixture<AttendanceBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendanceBlockComponent, AttendanceDaysComponent, AttendanceDayBlockComponent ],
      imports: [MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
        FormsModule, UiHelperModule, EntityModule,
      ],
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
