import { Component, Input, OnInit } from "@angular/core";
import { Child } from "../../model/child";

@Component({
  selector: "app-grouped-child-attendance",
  templateUrl: "./grouped-child-attendance.component.html",
  styleUrls: ["./grouped-child-attendance.component.scss"],
})
export class GroupedChildAttendanceComponent {
  @Input() child: Child;

  constructor() {}
}
