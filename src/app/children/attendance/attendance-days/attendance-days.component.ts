import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AttendanceDay, AttendanceStatus} from '../attendance-day';
import {ConfirmationDialogService} from '../../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {AttendanceMonth} from '../attendance-month';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-attendance-days',
  templateUrl: './attendance-days.component.html',
  styleUrls: ['./attendance-days.component.scss']
})
export class AttendanceDaysComponent implements OnInit {

  @Input() attendanceMonth: AttendanceMonth;
  records = new Array<AttendanceDay>();

  selectedRecord: AttendanceDay;
  selectedRecordChanged = false;

  private dayStatusSelect: MatSelect;
  @ViewChild('dayStatusSelect', { static: false }) set content(content: MatSelect) {
    this.dayStatusSelect = content;
  }


  statusValues = AttendanceStatus;

  constructor(private dialog: ConfirmationDialogService,
              private entityMapper: EntityMapperService) { }

  ngOnInit() {
    this.records = this.attendanceMonth.dailyRegister;
  }

  weekRecordsTrackByFunction = (index: number, item: any) => (item.length > 0) ? item[0].date.getTime() : undefined;
  recordTrackByFunction = (index: number, item: any) => item.date.getTime();

  getWeeks(): AttendanceDay[] {
    const weeks = [];
    let currentWeek = [];

    // fill first week with placeholder days if the month doesn't start on a Monday
    const firstDay = this.records[0].date;
    let daysUntilFirstOfMonth = firstDay.getDay();
    if (firstDay.getDay() === 0) { daysUntilFirstOfMonth = 7; } // workaround if first day of month is Sunday
    for (let i = 1; i < daysUntilFirstOfMonth; i++) {
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
      this.selectedRecord = undefined;
      return;
    }
    if (record === this.selectedRecord) {
      this.selectedRecord = undefined;
    } else {
      this.selectedRecord = record;
      setTimeout(() => this.dayStatusSelect.focus(), 100);
    }
  }

  save() {
    if (this.selectedRecordChanged) {
      this.entityMapper.save(this.attendanceMonth, true);
    }
    this.selectedRecordChanged = false;
  }

}
