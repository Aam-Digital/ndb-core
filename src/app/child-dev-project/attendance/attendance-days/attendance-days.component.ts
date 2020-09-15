import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { AttendanceDay, AttendanceStatus } from "../model/attendance-day";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { AttendanceMonth } from "../model/attendance-month";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MatSelect } from "@angular/material/select";

@Component({
  selector: "app-attendance-days",
  templateUrl: "./attendance-days.component.html",
  styleUrls: ["./attendance-days.component.scss"],
})
export class AttendanceDaysComponent {
  @Input() records: AttendanceDay[];

  selectedRecord: AttendanceDay;
  selectedRecordChanged = false;

  private dayStatusSelect: MatSelect;
  @ViewChild("dayStatusSelect") set content(content: MatSelect) {
    this.dayStatusSelect = content;
  }

  statusValues = AttendanceStatus;

  constructor(
    private dialog: ConfirmationDialogService,
    private entityMapper: EntityMapperService
  ) {}

  weekRecordsTrackByFunction = (index: number, item: any) =>
    item.length > 0 ? item[0].date.getTime() : undefined;
  recordTrackByFunction = (index: number, item: any) => item.date.getTime();

  /**
   * groups attendances in records by week
   */
  getWeeks(): AttendanceDay[] {
    const weeks = [];
    let currentWeek = [];

    // fill first week with placeholder days if the month doesn't start on a Monday
    const firstDay = this.records[0].date;
    let daysUntilFirstOfMonth = firstDay.getDay();
    if (firstDay.getDay() === 0) {
      daysUntilFirstOfMonth = 7;
    } // workaround if first day of month is Sunday
    for (let i = 1; i < daysUntilFirstOfMonth; i++) {
      const d = new Date(
        firstDay.getFullYear(),
        firstDay.getMonth(),
        firstDay.getDate() - i
      );
      currentWeek.unshift(new AttendanceDay("dummy"));
    }

    this.records.forEach((day) => {
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
    if (record._id === "dummy") {
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

  save(record: AttendanceDay) {
    if (this.selectedRecordChanged && record._id !== "dummy") {
      this.entityMapper.save(record, true);
    }
    this.selectedRecordChanged = false;
  }
}
