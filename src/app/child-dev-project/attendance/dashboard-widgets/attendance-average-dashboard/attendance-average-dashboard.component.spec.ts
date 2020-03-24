import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceAverageDashboardComponent } from './attendance-average-dashboard.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ChildrenService } from '../../../children/children.service';
import { ChildBlockComponent } from '../../../children/child-block/child-block.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SchoolBlockComponent } from '../../../schools/school-block/school-block.component';


describe('AttendanceAverageDashboardComponent', () => {
  let component: AttendanceAverageDashboardComponent;
  let fixture: ComponentFixture<AttendanceAverageDashboardComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  const mockAttendanceLastMonth = {
    rows: [
      { key: '1', sum: 10, count: 12 },
      { key: '2', sum: 12, count: 12 },
    ],
  };

  beforeEach(async(() => {
    mockChildrenService = jasmine.createSpyObj(
      'mockChildrenService',
      ['queryAttendanceLastMonth', 'getChild'],
    );
    mockChildrenService.queryAttendanceLastMonth.and.returnValue(Promise.resolve(mockAttendanceLastMonth));

    TestBed.configureTestingModule({
      declarations: [ ChildBlockComponent, SchoolBlockComponent, AttendanceAverageDashboardComponent],
      imports: [MatIconModule, MatCardModule, RouterTestingModule],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
      ],
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

});
