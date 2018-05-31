import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceAverageDashboardComponent } from './attendance-average-dashboard.component';
import {AttendanceMonth} from '../attendance-month';
import {MatCardModule, MatIconModule} from '@angular/material';
import {ChildrenService} from '../../children.service';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {RouterTestingModule} from '@angular/router/testing';

describe('AttendanceAverageDashboardComponent', () => {
  let component: AttendanceAverageDashboardComponent;
  let fixture: ComponentFixture<AttendanceAverageDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildBlockComponent, AttendanceAverageDashboardComponent],
      imports: [MatIconModule, MatCardModule, RouterTestingModule],
      providers: [ChildrenService, EntityMapperService, { provide: Database, useClass: MockDatabase }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceAverageDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  function getAttendanceTestData() {
    const data =  new Array<AttendanceMonth>();
    const a1 = new AttendanceMonth('1');
    a1.student = '22';
    a1.month = new Date('2018-01-01');
    a1.daysWorking = 20;
    a1.daysAttended = 18;
    data.push(a1);

    const a2 = new AttendanceMonth('2');
    a2.student = '22';
    a2.month = new Date('2018-02-01');
    a2.daysWorking = 22;
    a2.daysAttended = 5;
    data.push(a2);

    const a3 = new AttendanceMonth('3');
    a3.student = '22';
    a3.month = new Date('2018-03-01');
    a3.daysWorking = 19;
    a3.daysAttended = 11;
    a3.daysExcused = 3;
    data.push(a3);

    const a4 = new AttendanceMonth('4');
    a4.student = '22';
    a4.month = new Date('2018-04-01');
    a4.daysWorking = 19;
    a4.daysAttended = 11;
    a4.daysExcused = 3;
    data.push(a4);

    return data;
  }
});
