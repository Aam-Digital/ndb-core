import { Component, OnInit } from '@angular/core';
import {ChildrenService} from '../../children.service';
import {FilterSelection} from '../../../ui-helper/filter-selection/filter-selection';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {AttendanceDay, AttendanceStatus} from '../attendance-day';
import {AttendanceMonth} from '../attendance-month';
import {Child} from '../../child';

@Component({
  selector: 'app-add-day-attendance',
  templateUrl: './add-day-attendance.component.html',
  styleUrls: ['./add-day-attendance.component.scss']
})
export class AddDayAttendanceComponent implements OnInit {

  currentStage = 0;
  day = new Date();
  attendanceType: string;
  center: string;
  studentGroups = new FilterSelection<Child>('Groups', [
    { key: 'all', label: 'All Students', filterFun: (c: Child) => c.center === this.center}
    ]);
  rollCallList: {child: Child, attendanceDay: AttendanceDay, attendanceMonth: AttendanceMonth}[] = [];
  rollCallIndex = 0;
  rollCallListLoading;

  centers: string[];
  children: Child[];

  stages = [
    'Select Center',
    'Select Student Group',
    'Roll Call'
  ];
  AttStatus = AttendanceStatus;

  constructor(private childrenService: ChildrenService,
              private entityMapper: EntityMapperService) { }

  ngOnInit() {
    this.childrenService.getChildren().subscribe(children => {
      this.children = children.filter(c => c.isActive()).sort((a, b) => a.schoolClass > b.schoolClass ? 1 : -1);
      this.centers = this.children.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
    });
  }


  finishCenterSelection() {
    this.studentGroups.options.splice(1);

    this.children
      .filter(c => c.center === this.center)
      .map(c => c.schoolId).filter((value, index, arr) => arr.indexOf(value) === index)
      .forEach(schoolId => {
        const filterOption = {
          key: schoolId,
          label: schoolId,
          type: 'school',
          filterFun: (c: Child) => c.schoolId === schoolId
        };
        this.studentGroups.options.push(filterOption);
      });

    this.currentStage = 1;
  }


  startRollCall(group) {
    const selectedChildren = this.children.filter(group.filterFun);

    this.rollCallList = [];
    this.rollCallListLoading = true;
    this.childrenService.getAttendancesOfMonth(this.day)
      .subscribe(attendances => this.loadMonthAttendanceRecords(selectedChildren, attendances));

    this.currentStage = 2;
  }

  private loadMonthAttendanceRecords(children: Child[], monthsAttendances: AttendanceMonth[]) {
    this.rollCallIndex = 0;

    children.forEach(child => {
      let attMonth: AttendanceMonth = monthsAttendances.find(a => a.student === child.getId() && a.institution === this.attendanceType);
      if (attMonth === undefined) {
        attMonth = AttendanceMonth.createAttendanceMonth(child.getId(), this.attendanceType);
        attMonth.month = this.day;
      }

      const attDay = attMonth.dailyRegister.find(d => d.date.getDate() === this.day.getDate()
        && d.date.getMonth() === this.day.getMonth() && d.date.getFullYear() === this.day.getFullYear());

      this.rollCallList.push({child: child, attendanceMonth: attMonth, attendanceDay: attDay});
    });

    this.rollCallListLoading = false;
  }


  markAttendance(status: AttendanceStatus) {
    const rollCallListEntry = this.rollCallList[this.rollCallIndex];
    rollCallListEntry.attendanceDay.status = status;
    this.entityMapper.save(rollCallListEntry.attendanceMonth);

    setTimeout(() => this.rollCallIndex++, 750);
  }

}
