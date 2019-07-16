import {Component, OnInit} from '@angular/core';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {Child} from '../../child';
import { MatTableDataSource } from '@angular/material/table';
import {AttendanceMonth} from '../attendance-month';
import {ConfirmationDialogService} from '../../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {AlertService} from '../../../alerts/alert.service';
import {ChildrenService} from '../../children.service';
import {School} from '../../../schools/school';

@Component({
  selector: 'app-add-month-attendance',
  templateUrl: './add-month-attendance.component.html',
  styleUrls: ['./add-month-attendance.component.scss']
})
export class AddMonthAttendanceComponent implements OnInit {
  schools = new Array<School>();
  centers = new Array<string>();

  children = new Array<Child>();
  childrenBySchool = new Map<string, Child[]>();
  childrenByCenter = new Map<string, Child[]>();

  attendanceDataSource = new MatTableDataSource();
  columnsToDisplay = ['student', 'daysAttended', 'daysExcused', 'remarks', 'daysWorking'];
  loadingExistingRecords = false;

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
    this.childrenService.getChildren().subscribe(children => {
      this.children = children.filter((c: Child) => c.isActive());
      this.initChildrenLookupTables(this.children);

      this.centers = children.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
    });
  }

  private initChildrenLookupTables(children: Child[]) {
    this.childrenBySchool = new Map<string, Child[]>();
    this.childrenByCenter = new Map<string, Child[]>();

    children.forEach(c => {
      let arrS = this.childrenBySchool.get(c.schoolId);
      if (arrS === undefined) {
        arrS = [];
        this.childrenBySchool.set(c.schoolId, arrS);
      }
      arrS.push(c);

      let arrC = this.childrenByCenter.get(c.center);
      if (arrC === undefined) {
        arrC = [];
        this.childrenByCenter.set(c.center, arrC);
      }
      arrC.push(c);
    });
  }


  loadTable() {
    const records = new Array<AttendanceMonth>();
    this.getFilteredStudents()
      .sort((a, b) => a.schoolClass > b.schoolClass ? 1 : -1)
      .forEach((c: Child) => {
        const att = AttendanceMonth.createAttendanceMonth(c.getId(), this.attendanceType);
        att.month = this.month;
        records.push(att);
      });
    this.loadExistingAttendanceRecordIfAvailable(records, this.month, this.attendanceType);

    this.attendanceDataSource.data = records;
  }

  private getFilteredStudents(): Child[] {
    let result;
    if (this.attendanceType === 'school') {
      result = this.childrenBySchool.get(this.school);
    }
    if (this.attendanceType === 'coaching') {
      result = this.childrenByCenter.get(this.coachingCenter);
    }

    if (result === undefined) {
      result = [];
    }

    return result;
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


  private loadExistingAttendanceRecordIfAvailable(recordsToOverwrite: AttendanceMonth[], month: Date, attendanceType: string) {
    if (month === undefined) {
      return;
    }

    this.loadingExistingRecords = true;

    this.childrenService.getAttendancesOfMonth(this.month)
      .subscribe(records => {
        recordsToOverwrite.forEach(recordToOverwrite => {
          const relevantExistingRecords = records.filter((a: AttendanceMonth) => a.student === recordToOverwrite.student
            && a.institution === attendanceType);
          if (relevantExistingRecords.length > 0) {
            Object.assign(recordToOverwrite, relevantExistingRecords[0]);
            recordToOverwrite.overridden = true;
          }
        });

        this.loadingExistingRecords = false;
      });
  }
}
