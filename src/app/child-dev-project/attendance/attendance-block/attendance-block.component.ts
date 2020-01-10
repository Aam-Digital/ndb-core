import {Component, Input, OnInit} from '@angular/core';
import {AttendanceMonth} from '../model/attendance-month';

@Component({
  selector: 'app-attendance-block',
  templateUrl: './attendance-block.component.html',
  styleUrls: ['./attendance-block.component.scss']
})
export class AttendanceBlockComponent implements OnInit {
  @Input() attendanceData: AttendanceMonth;
  tooltip = false;
  tooltipTimeout;

  constructor() { }

  ngOnInit() {
  }

  showTooltip() {
    this.tooltip = true;
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
  }
  hideTooltip() {
    this.tooltipTimeout = setTimeout(() => this.tooltip = false, 250);
  }

}
