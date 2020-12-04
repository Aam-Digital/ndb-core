import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { AttendanceMonth } from "../../../attendance/model/attendance-month";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { MediaChange, MediaObserver } from "@angular/flex-layout";

@Component({
  selector: "app-list-attendance",
  templateUrl: "./list-attendance.component.html",
  styleUrls: ["./list-attendance.component.scss"],
})
export class ListAttendanceComponent implements OnChanges {
  attendanceList: AttendanceMonth[] = [];
  maxAttendanceBlocks: number = 3;

  @Input() filterBy: string;
  @Input() child: Child;

  constructor(
    private childrenService: ChildrenService,
    private media: MediaObserver
  ) {
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

  ngOnChanges(change: SimpleChanges): void {
    if (change.hasOwnProperty("child")) {
      this.childrenService
        .getAttendancesOfChild(this.child.getId())
        .subscribe((result) => this.prepareAttendanceData(result));
    }
  }

  private prepareAttendanceData(loadedEntities: AttendanceMonth[]) {
    this.attendanceList = loadedEntities.sort((a, b) => {
      // descending by date
      if (a.month > b.month) {
        return -1;
      }
      if (a.month < b.month) {
        return 1;
      }
      return 0;
    });
    return;
  }
}
