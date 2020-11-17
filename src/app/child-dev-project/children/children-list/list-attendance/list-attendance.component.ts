import { Component, Input, OnInit } from "@angular/core";
import { AttendanceMonth } from "../../../attendance/model/attendance-month";
import { untilDestroyed } from "@ngneat/until-destroy";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { MediaChange, MediaObserver } from "@angular/flex-layout";

@Component({
  selector: "app-list-attendance",
  templateUrl: "./list-attendance.component.html",
  styleUrls: ["./list-attendance.component.scss"],
})
export class ListAttendanceComponent implements OnInit {
  attendanceList = new Map<string, AttendanceMonth[]>();
  maxAttendanceBlocks: number = 3;

  @Input() filterBy: string;
  @Input() child: Child;

  constructor(
    private childrenService: ChildrenService,
    private media: MediaObserver
  ) {}

  ngOnInit(): void {
    this.childrenService
      .getAttendances()
      .subscribe((results) => this.prepareAttendanceData(results));
    this.media.asObservable().subscribe((change: MediaChange[]) => {
      switch (change[0].mqAlias) {
        case "xs":
        case "sm": {
          this.maxAttendanceBlocks = 1;
          break;
        }
        case "md": {
          this.maxAttendanceBlocks = 2;
          break;
        }
        case "lg": {
          this.maxAttendanceBlocks = 3;
          break;
        }
        case "xl": {
          this.maxAttendanceBlocks = 6;
          break;
        }
      }
    });
  }

  prepareAttendanceData(loadedEntities: AttendanceMonth[]) {
    this.attendanceList = new Map<string, AttendanceMonth[]>();
    loadedEntities.forEach((x) => {
      if (!this.attendanceList.has(x.student)) {
        this.attendanceList.set(x.student, new Array<AttendanceMonth>());
      }
      this.attendanceList.get(x.student).push(x);
    });

    this.attendanceList.forEach((studentsAttendance) => {
      studentsAttendance.sort((a, b) => {
        // descending by date
        if (a.month > b.month) {
          return -1;
        }
        if (a.month < b.month) {
          return 1;
        }
        return 0;
      });
    });
  }
}
