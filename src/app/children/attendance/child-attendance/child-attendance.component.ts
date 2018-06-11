import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AttendanceMonth} from '../attendance-month';
import {ChildrenService} from '../../children.service';
import {ColumnDescription} from '../../../ui-helper/entity-subrecord/column-description';
import {DatePipe, PercentPipe} from '@angular/common';


@Component({
  selector: 'app-child-attendance',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="generateNewRecordFactory()">' +
  '</app-entity-subrecord>',
})
export class ChildAttendanceComponent implements OnInit {

  childId: string;
  records: Array<AttendanceMonth>;

  columns: Array<ColumnDescription> = [
    new ColumnDescription('month', 'Month', 'month', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM')),
    new ColumnDescription('daysAttended', 'Present', 'number'),
    new ColumnDescription('daysWorking', 'Working Days', 'number'),
    new ColumnDescription('getAttendancePercentage', 'Attended', 'function', null,
      (v: number) => this.percentPipe.transform(v, '1.0-0')),
    new ColumnDescription('daysExcused', 'Excused', 'number'),
    new ColumnDescription('remarks', 'Remarks', 'textarea'),
  ];


  constructor(private route: ActivatedRoute,
              private childrenService: ChildrenService,
              private datePipe: DatePipe,
              private percentPipe: PercentPipe) {
  }

  ngOnInit() {
    this.childId = this.route.snapshot.params['id'].toString();

    this.childrenService.getAttendancesOfChild(this.childId)
      .subscribe(results => this.records = results.sort((a, b) => b.month.valueOf() - a.month.valueOf()));
  }


  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const child = this.childId;

    return () => {
      const newAtt = new AttendanceMonth(Date.now().toString()); // TODO: logical way to assign entityId to Attendance?
      newAtt.month = new Date();
      newAtt.student = child;

      return newAtt;
    };
  }
}
