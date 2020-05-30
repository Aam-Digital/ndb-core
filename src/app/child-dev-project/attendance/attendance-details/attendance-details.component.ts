import { Component, Input, ViewChild } from "@angular/core";
import { AttendanceMonth } from "../model/attendance-month";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";

@Component({
  selector: "app-attendance-details",
  templateUrl: "./attendance-details.component.html",
  styleUrls: ["./attendance-details.component.scss"],
})
export class AttendanceDetailsComponent implements ShowsEntity {
  @Input() entity: AttendanceMonth = new AttendanceMonth("");
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  constructor() {}
}
