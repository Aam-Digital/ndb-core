import {Component, OnInit} from '@angular/core';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {School} from '../../../schools/school';
import {Child} from '../../child';
import {MatTableDataSource} from '@angular/material';
import {AttendanceMonth} from '../attendance-month';
import {ConfirmationDialogService} from '../../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {AlertService} from '../../../alerts/alert.service';
import {ChildrenService} from '../../children.service';

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

  constructor(private entityMapper: EntityMapperService,
              private childrenService: ChildrenService,
              private confirmDialog: ConfirmationDialogService,
              private alertService: AlertService) { }

  ngOnInit() {
    this.entityMapper.loadType<School>(School).then(schools => this.schools = schools);
    this.entityMapper.loadType<Child>(Child).then(children => {
      this.children = children.filter((c: Child) => c.isActive());
      this.centers = children.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
    });
  }


  loadTable() {
    const records = new Array<AttendanceMonth>();

    this.getFilteredStudents()
      .forEach((c: Child) => {
        const att = this.createAttendanceRecord(c, this.month, this.attendanceType);
        this.loadExistingAttendanceRecordIfAvailable(att, c, this.month, this.attendanceType);

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


  updateWorkingDays() {
    this.attendanceDataSource.data.forEach((att: AttendanceMonth) => {
      if (!att.overridden) {
        att.daysWorking = this.workingDays;
      }
    });
  }

  updateMonth(event) {
    this.month = event.target.valueAsDate;
    this.attendanceDataSource.data.forEach((att: AttendanceMonth) => att.month = this.month);
  }

  resetOverriddenWorkingDays(att: AttendanceMonth) {
    if (!att.overridden) {
      att.daysWorking = this.workingDays;
    }
  }

  isDataEnteredComplete() {
    let okay = true;
    if (this.month === undefined) {
      okay = false;
    }

    this.attendanceDataSource.data.forEach((att: AttendanceMonth) => {
      if (att.daysAttended === undefined || att.daysWorking === undefined) {
        okay = false;
      }
    });

    return okay;
  }

  save() {
    if (!this.isDataEnteredComplete()) {
      this.confirmDialog.openDialog('Incomplete Data',
        'Please complete the information for all students. Excused absences and remarks are optional.',
        false);
      return;
    }

    this.attendanceDataSource.data.forEach((att: AttendanceMonth) => {
      this.entityMapper.save(att);
    });
    this.alertService.addSuccess(this.attendanceDataSource.data.length + ' attendance records saved.');

    this.reset();
  }

  private reset() {
    this.workingDays = undefined;
    this.school = undefined;
    this.coachingCenter = undefined;
    this.loadTable();
  }


  private loadExistingAttendanceRecordIfAvailable(recordToOverwrite: AttendanceMonth, c: Child, month: Date, attendanceType: string) {
    if (month === undefined) {
      return;
    }

    this.childrenService.getAttendancesOfChild(c.getId())
      .subscribe(records => {
        const relevantRecords = records.filter((a: AttendanceMonth) => a.institution === attendanceType &&
          (a.month.getUTCFullYear() === month.getUTCFullYear() && a.month.getUTCMonth() === month.getUTCMonth()));
        if (relevantRecords.length > 0) {
          recordToOverwrite.load(relevantRecords[0]);
          recordToOverwrite.overridden = true;
        }
      });
  }

  private createAttendanceRecord(c: Child, month: Date, attendanceType: string) {
    const att = new AttendanceMonth((new Date()).getTime().toString());
    att.student = c.getId();
    att.institution = attendanceType;
    att.month = month;
    att.daysWorking = this.workingDays;

    return att;
  }
}
