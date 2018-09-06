import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceWeekDashboardComponent } from './attendance-week-dashboard.component';
import {MatCardModule, MatIconModule, MatTooltipModule} from '@angular/material';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {AttendanceDayBlockComponent} from '../attendance-days/attendance-day-block.component';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {ChildrenService} from '../../children.service';
import {EntityModule} from '../../../entity/entity.module';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {RouterTestingModule} from '@angular/router/testing';

describe('AttendanceWeekDashboardComponent', () => {
  let component: AttendanceWeekDashboardComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendanceWeekDashboardComponent, ChildBlockComponent, AttendanceDayBlockComponent, SchoolBlockComponent ],
      imports: [MatIconModule, MatCardModule, MatTooltipModule,
        RouterTestingModule.withRoutes([]),
        EntityModule],
      providers: [
        { provide: ChildrenService, useClass: ChildrenService },
        { provide: Database, useClass: MockDatabase },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceWeekDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
