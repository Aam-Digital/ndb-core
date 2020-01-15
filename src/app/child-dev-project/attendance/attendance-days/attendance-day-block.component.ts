import { Component, Input, OnInit } from '@angular/core';
import { AttendanceDay } from '../model/attendance-day';

@Component({
  selector: 'app-attendance-day-block]',
  templateUrl: './attendance-day-block.component.html',
  styleUrls: ['./attendance-days.component.scss'],
})
export class AttendanceDayBlockComponent implements OnInit {

  @Input() entity: AttendanceDay;
  @Input() showDate = true;
  @Input() showHighlighted = false;

  constructor() { }

  ngOnInit() {

  }

}
