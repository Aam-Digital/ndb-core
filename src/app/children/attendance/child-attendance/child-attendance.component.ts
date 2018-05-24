import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AttendanceMonth} from '../attendance-month';
import {Child} from '../../child';
import {ChildrenService} from '../../children.service';

@Component({
  selector: 'app-child-attendance',
  templateUrl: './child-attendance.component.html',
  styleUrls: ['./child-attendance.component.scss']
})
export class ChildAttendanceComponent implements OnInit {
  attendanceRecords: Array<AttendanceMonth>;
  child: Child;

  columnsToDisplay = ['month', 'attended', 'working', 'percent'];

  constructor(private route: ActivatedRoute, private childrenService: ChildrenService) {
  }

  ngOnInit() {
    const params = this.route.snapshot.params;
    const childId = params['id'];

    this.childrenService.getChild(childId)
      .subscribe(result => this.child = result);

    this.childrenService.getAttendances()
      .subscribe(results => this.attendanceRecords = results);
  }

}
