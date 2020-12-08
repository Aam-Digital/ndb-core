import { Component, Input } from "@angular/core";
import { AttendanceMonth } from "../../../attendance/model/attendance-month";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-list-attendance",
  template: `
    <app-attendance-block
      *ngFor="
        let att of attendanceList
          | filterBy: { institution: filterBy }
          | slice: 0:maxAttendanceBlocks
      "
      [attendanceData]="att"
    ></app-attendance-block>
  `,
})
export class ListAttendanceComponent implements OnInitDynamicComponent {
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

  onInitFromDynamicConfig(config: any) {
    this.filterBy = config.id;
    if (config.hasOwnProperty("entity")) {
      this.child = config.entity;
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
