import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceDaysComponent } from './attendance-days.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {FormsModule} from '@angular/forms';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {EntityModule} from '../../../entity/entity.module';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {AttendanceMonth} from '../attendance-month';
import {AttendanceDayBlockComponent} from './attendance-day-block.component';

describe('AttendanceDaysComponent', () => {
  let component: AttendanceDaysComponent;
  let fixture: ComponentFixture<AttendanceDaysComponent>;

  let attendanceMonth: AttendanceMonth;


  beforeEach(async(() => {
    attendanceMonth = new AttendanceMonth('');
    attendanceMonth.month = new Date('2018-01-01');

    TestBed.configureTestingModule({
      declarations: [ AttendanceDayBlockComponent, AttendanceDaysComponent ],
      imports: [MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
        FormsModule,
        UiHelperModule, EntityModule],
      providers: [
        { provide: Database, useClass: MockDatabase },
      ]
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
