import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AttendanceMonth} from '../attendance-month';
import {ChildrenService} from '../../children.service';
import {ColumnDescription} from '../../../ui-helper/entity-subrecord/column-description';
import {DatePipe, PercentPipe} from '@angular/common';
import {AttendanceDetailsComponent} from '../attendance-details/attendance-details.component';


@Component({
  selector: 'app-child-attendance',
  templateUrl: './child-attendance.component.html',
})
export class ChildAttendanceComponent implements OnInit {

  childId: string;
  records: Array<AttendanceMonth>;
  detailsComponent = AttendanceDetailsComponent;

  @Input() institution: string;
  @Input() showDailyAttendanceOfLatest = false;


  columns: Array<ColumnDescription> = [
    new ColumnDescription('month', 'Month', 'month', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM'), 'xs'),
    new ColumnDescription('daysAttended', 'Present', 'number', null, undefined,  'xs'),
    new ColumnDescription('daysWorking', 'Working Days', 'number',  null, undefined, 'xs'),
    new ColumnDescription('getAttendancePercentage', 'Attended', 'function', null,
      (v: number) => this.percentPipe.transform(v, '1.0-0'), 'md'),
    new ColumnDescription('daysExcused', 'Excused', 'number', null, undefined, 'md'),
    new ColumnDescription('remarks', 'Remarks', 'textarea', null, undefined, 'xl'),
  ];


  constructor(private route: ActivatedRoute,
              private childrenService: ChildrenService,
              private datePipe: DatePipe,
              private percentPipe: PercentPipe) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.childId = params.get('id').toString();
      this.loadData(this.childId);
    });
  }

  loadData(id: string) {
    this.childrenService.getAttendancesOfChild(id)
      .subscribe(results => {
        this.records = results
          .filter(r => this.institution === undefined || r.institution === this.institution)
          .sort((a, b) => (b.month ? b.month.valueOf() : 0) - (a.month ? a.month.valueOf() : 0) );

        if (this.showDailyAttendanceOfLatest) {
          this.createCurrentMonthsAttendanceIfNotExists();
        }
      });
  }

  private createCurrentMonthsAttendanceIfNotExists() {
    const now = new Date();
    if (this.records.length === 0
      || this.records[0].month.getFullYear() !== now.getFullYear() || this.records[0].month.getMonth() !== now.getMonth()) {
      this.records.unshift(AttendanceMonth.createAttendanceMonth(this.childId, this.institution));
    }
  }


  generateNewRecordFactory() {
    // define values locally because 'this' is a different scope after passing a function as input to another component
    const child = this.childId;
    const institution = this.institution;

    return () => {
      return AttendanceMonth.createAttendanceMonth(child, institution);
    };
  }
}
