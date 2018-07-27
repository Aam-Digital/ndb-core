import {Component, OnInit} from '@angular/core';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {School} from '../../../schools/school';
import {Child} from '../../child';
import {MatTableDataSource} from '@angular/material';
import {AttendanceMonth} from '../attendance-month';

@Component({
  selector: 'app-add-month-attendance',
  templateUrl: './add-month-attendance.component.html',
  styleUrls: ['./add-month-attendance.component.scss']
})
export class AddMonthAttendanceComponent implements OnInit {
  schools = new Array<School>();
  centers = new Array<string>();
  children = new Array<Child>();

  attendanceDataSource = new MatTableDataSource();
  columnsToDisplay = ['student', 'daysAttended', 'daysExcused', 'remarks', 'daysWorking'];

  attendanceType = 'school';
  school;
  coachingCenter;
  workingDays;
  month;

  constructor(private entityMapper: EntityMapperService) { }

  ngOnInit() {
    this.entityMapper.loadType<School>(School).then(schools => this.schools = schools);
    this.entityMapper.loadType<Child>(Child).then(children => {
      this.children = children.filter((c: Child) => c.isActive());
      this.centers = children.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
    });
  }


  loadTable() {
    const records = new Array<AttendanceMonth>();

    console.log(this.children);
    console.log(this.schools);
    console.log(this.school);
    console.log(this.coachingCenter);

    this.getFilteredStudents()
      .forEach((c: Child) => {
        const att = new AttendanceMonth((new Date()).getTime().toString());
        att.student = c.getId();
        att.institution = this.attendanceType;
        att.month = this.month;
        att.daysWorking = this.workingDays;

        records.push(att);
      });

    this.attendanceDataSource.data = records;
  }

  private getFilteredStudents() {
    if (this.attendanceType === 'school') {
      return this.children.filter((c: Child) => c.schoolId === this.school);
    }
    if (this.attendanceType === 'coaching') {
      return this.children.filter((c: Child) => c.center === this.coachingCenter);
    }

    return [];
  }
}
