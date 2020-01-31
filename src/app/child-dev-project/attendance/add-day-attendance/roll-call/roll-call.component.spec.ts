import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RollCallComponent } from './roll-call.component';
import { ChildrenModule } from '../../../children/children.module';
import { EntityMapperService } from '../../../../core/entity/entity-mapper.service';
import { ChildrenService } from '../../../children/children.service';
import { Child } from '../../../children/model/child';
import { of } from 'rxjs';
import { AttendanceMonth } from '../../model/attendance-month';
import { AttendanceStatus } from '../../model/attendance-day';

describe('RollCallComponent', () => {
  let component: RollCallComponent;
  let fixture: ComponentFixture<RollCallComponent>;

  let mockEntityMapper;
  let mockChildrenService;

  beforeEach(async(() => {
    mockEntityMapper = jasmine.createSpyObj(['save']);
    mockChildrenService = jasmine.createSpyObj(['getAttendancesOfMonth']);

    TestBed.configureTestingModule({
      imports: [
        ChildrenModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: ChildrenService, useValue: mockChildrenService },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should load correct list of attendance on init', async () => {
    const testStudents = [
      new Child('1'),
      new Child('2'),
    ];
    const testAttendanceType = 'coaching';
    const testDate = new Date('2020-01-05');

    const testAttendances = [
      new AttendanceMonth('a1'),
      new AttendanceMonth('a2'),
      new AttendanceMonth('a3'),
      new AttendanceMonth('a4'),
    ];
    testAttendances[0].month = new Date('2020-01-02');
    testAttendances[0].student = '1';
    testAttendances[0].institution = testAttendanceType;
    testAttendances[1].month = new Date('2020-01-02');
    testAttendances[1].student = '2';
    testAttendances[1].institution = testAttendanceType;
    testAttendances[2].month = new Date('2020-01-02');
    testAttendances[2].student = '2';
    testAttendances[2].institution = 'school';
    testAttendances[3].month = new Date('2020-01-02');
    testAttendances[3].student = '3';
    testAttendances[3].institution = testAttendanceType;

    mockChildrenService.getAttendancesOfMonth.and.returnValue(of(testAttendances));

    component.students = testStudents;
    component.attendanceType = testAttendanceType;
    component.day = testDate;
    await component.ngOnInit();

    expect(component.isLoading).toBe(false);
    expect(component.rollCallList).toEqual([
      { attendanceMonth: testAttendances[0], attendanceDay: testAttendances[0].dailyRegister[4], child: testStudents[0] },
      { attendanceMonth: testAttendances[1], attendanceDay: testAttendances[1].dailyRegister[4], child: testStudents[1] },
    ]);
    expect(component.rollCallList[0].attendanceDay.date).toEqual(testDate);
  });


  it('should create new attendance records if none exist', async () => {
    const testStudents = [
      new Child('1'),
    ];
    const testAttendanceType = 'coaching';
    const testDate = new Date('2020-01-05');

    const testAttendances = [];

    mockChildrenService.getAttendancesOfMonth.and.returnValue(of(testAttendances));

    component.students = testStudents;
    component.attendanceType = testAttendanceType;
    component.day = testDate;
    await component.ngOnInit();

    expect(component.isLoading).toBe(false);
    expect(component.rollCallList.length).toBe(1);
    expect(component.rollCallList[0].child).toBe(testStudents[0]);
    expect(component.rollCallList[0].attendanceMonth.institution).toBe(testAttendanceType);
    expect(component.rollCallList[0].attendanceMonth.month.getFullYear()).toEqual(testDate.getFullYear());
    expect(component.rollCallList[0].attendanceMonth.month.getMonth()).toEqual(testDate.getMonth());
  });


  it('should save entity when marking attendance', async () => {
    const testStudents = [
      new Child('1'),
    ];
    const testAttendanceType = 'coaching';
    const testDate = new Date('2020-01-05');

    const testAttendances = [
      new AttendanceMonth('a1'),
    ];
    testAttendances[0].month = new Date('2020-01-02');
    testAttendances[0].student = '1';
    testAttendances[0].institution = testAttendanceType;

    mockChildrenService.getAttendancesOfMonth.and.returnValue(of(testAttendances));

    component.students = testStudents;
    component.attendanceType = testAttendanceType;
    component.day = testDate;
    await component.ngOnInit();

    component.markAttendance(AttendanceStatus.PRESENT);

    expect(mockEntityMapper.save).toHaveBeenCalledWith(testAttendances[0]);
    expect(testAttendances[0].dailyRegister[4].status).toBe(AttendanceStatus.PRESENT);
  });
});
