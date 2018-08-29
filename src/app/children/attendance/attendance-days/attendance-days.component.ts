import {Component, Input, OnInit} from '@angular/core';
import {AttendanceDay, AttendanceStatus} from '../attendance-day';
import {ConfirmationDialogService} from '../../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {AttendanceMonth} from '../attendance-month';
import {EntityMapperService} from '../../../entity/entity-mapper.service';

@Component({
  selector: 'app-attendance-days',
  templateUrl: './attendance-days.component.html',
  styleUrls: ['./attendance-days.component.scss']
})
export class AttendanceDaysComponent implements OnInit {

  @Input() attendanceMonth: AttendanceMonth;
  records = new Array<AttendanceDay>();

  selectedRecord: AttendanceDay;
  selectedRecordOriginal: AttendanceDay;

  statusValues = AttendanceStatus;

  constructor(private dialog: ConfirmationDialogService,
              private entityMapper: EntityMapperService) { }

  ngOnInit() {
    this.records = this.attendanceMonth.dailyRegister;
  }

  getWeeks(): AttendanceDay[] {
    const weeks = [];
    let currentWeek = [];

    // fill first week with placeholder days if the month doesn't start on a Monday
    const firstDay = this.records[0].date;
    for (let i = 1; i < firstDay.getDay(); i++) {
      const d = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - i);
      currentWeek.unshift(new AttendanceDay(d));
    }

    this.records.forEach(day => {
      if (day.date.getDay() === 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    weeks.push(currentWeek);

    return weeks;
  }

  selectCell(record: AttendanceDay) {
    if (record.date.getMonth() !== this.attendanceMonth.month.getMonth()) {
      return;
    } else if (this.selectedRecord !== undefined) {
      this.dialog.openDialog('Unsaved Changes',
        'Please save or cancel the current changes before selecting a new record.',
        false);
    } else {
      this.selectedRecord = record;
      this.selectedRecordOriginal = Object.assign({}, record);
    }
  }

  save() {
    this.entityMapper.save(this.attendanceMonth);
    this.selectedRecord = undefined;
  }

  cancel() {
    Object.assign(this.selectedRecord, this.selectedRecordOriginal);
    this.selectedRecord = undefined;
  }

}
