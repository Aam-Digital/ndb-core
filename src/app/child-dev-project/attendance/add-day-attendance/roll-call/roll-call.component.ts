import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AttendanceStatus } from '../../model/attendance-day';
import { EntityMapperService } from '../../../../core/entity/entity-mapper.service';
import { Child } from '../../../children/model/child';
import { AttendanceMonth } from '../../model/attendance-month';
import { ChildrenService } from '../../../children/children.service';
import { RollCallRecord } from './roll-call-record';
import { animate, style, transition, trigger } from '@angular/animations';

/**
 * Displays the given children one by one to the user to mark the attendance status for the given day and type.
 * This component itself handles the loading and saving of the attendances entities internally.
 */
@Component({
  selector: 'app-roll-call',
  templateUrl: './roll-call.component.html',
  styleUrls: ['./roll-call.component.scss'],
  animations: [
    trigger('completeRollCall', [
      transition('void => *', [
        style({ backgroundColor: 'white' }),
        animate(1000),
      ]),
    ]),
  ],
})
export class RollCallComponent implements OnInit {

  /**
   * The day for which attendance will be recorded
   */
  @Input() day: Date;

  /**
   * The attendance type to be checked and saved (e.g. 'coaching' or 'school')
   */
  @Input() attendanceType: string;

  /**
   * The children for whom attendance will be recorded
   */
  @Input() students: Child[] = [];

  /**
   * Event emitted when the roll call is finished (or aborted).
   */
  @Output() complete = new EventEmitter();


  isLoading: boolean = true;
  currentIndex: number;
  rollCallList: RollCallRecord[] = [];

  AttStatus = AttendanceStatus;

  constructor(
    private entityMapper: EntityMapperService,
    private childrenService: ChildrenService,
  ) { }

  async ngOnInit() {
    await this.loadList();
  }



  private async loadList() {
    this.isLoading = true;

    this.currentIndex = 0;

    this.rollCallList = await this.loadMonthAttendanceRecords(this.students);
    this.sortRollCallList();

    this.isLoading = false;
  }

  private async loadMonthAttendanceRecords(children: Child[]): Promise<RollCallRecord[]> {
    const rollCallRecords: RollCallRecord[] = [];

    const attendances = await this.childrenService.getAttendancesOfMonth(this.day).toPromise();
    children.forEach(child => {
      let attMonth: AttendanceMonth = attendances.find(a => a.student === child.getId() && a.institution === this.attendanceType);
      if (attMonth === undefined) {
        attMonth = AttendanceMonth.createAttendanceMonth(child.getId(), this.attendanceType);
        attMonth.month = new Date(this.day.getTime());
      }

      const attDay = attMonth.dailyRegister.find(d => d.date.getDate() === this.day.getDate()
        && d.date.getMonth() === this.day.getMonth() && d.date.getFullYear() === this.day.getFullYear());

      rollCallRecords.push({child: child, attendanceMonth: attMonth, attendanceDay: attDay});
    });

    return rollCallRecords;
  }

  private sortRollCallList() {
    this.rollCallList.sort((a: RollCallRecord, b: RollCallRecord) => {
      const diff = parseInt(a.child.schoolClass, 10) - parseInt(b.child.schoolClass, 10);
      if (!isNaN(diff)) {
        return diff;
      }

      if (a.child.schoolClass > b.child.schoolClass) { return 1; }
      if (a.child.schoolClass < b.child.schoolClass) { return -1; }
      return 0;
    });
  }


  markAttendance(status: AttendanceStatus) {
    const rollCallListEntry = this.rollCallList[this.currentIndex];
    rollCallListEntry.attendanceDay.status = status;
    this.entityMapper.save(rollCallListEntry.attendanceMonth);

    setTimeout(() => this.currentIndex++, 750);
  }


  endRollCall() {
    this.complete.emit();
  }

  isFinished(): boolean {
    return this.currentIndex >= this.rollCallList.length;
  }
}
