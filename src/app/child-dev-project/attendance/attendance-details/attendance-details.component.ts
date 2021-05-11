import { Component, Input, ViewChild } from "@angular/core";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { ActivityAttendance } from "../model/activity-attendance";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import { Note } from "../../notes/model/note";
import { calculateAverageAttendance } from "../model/calculate-average-event-attendance";
import { NullAttendanceStatusType } from "../model/attendance-status";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PercentPipe } from "@angular/common";

@Component({
  selector: "app-attendance-details",
  templateUrl: "./attendance-details.component.html",
  styleUrls: ["./attendance-details.component.scss"],
})
export class AttendanceDetailsComponent
  implements ShowsEntity<ActivityAttendance>, OnInitDynamicComponent {
  @Input() entity: ActivityAttendance = new ActivityAttendance();
  @Input() focusedChild: string;
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  eventDetailsComponent = { component: NoteDetailsComponent };
  eventsColumns: Array<ColumnDescription> = [
    {
      name: "date",
      label: $localize`Date`,
      inputType: ColumnDescriptionInputType.DATE,
    },
    {
      name: "subject",
      label: $localize`Event`,
      inputType: ColumnDescriptionInputType.TEXT,
    },
    {
      name: "getAttendance",
      label: $localize`:How a child attended, e.g. too late, in time, excused, e.t.c:Attended`,
      inputType: ColumnDescriptionInputType.FUNCTION,
      valueFunction: (note: Note) => {
        if (this.focusedChild) {
          return note.getAttendance(this.focusedChild).status.label;
        } else {
          return (
            Math.round(calculateAverageAttendance(note).average * 10) / 10 ||
            "N/A"
          );
        }
      },
    },
  ];
  UnknownStatus = NullAttendanceStatusType;

  constructor(private percentPipe: PercentPipe) {}

  onInitFromDynamicConfig(config?: { forChild?: string }) {
    if (config?.forChild) {
      this.focusedChild = config.forChild;
    }
  }

  get attendance(): string {
    if (this.focusedChild) {
      return this.percentPipe.transform(
        this.entity?.getAttendancePercentage(this.focusedChild),
        "1.0-0"
      );
    } else {
      return this.percentPipe.transform(
        this.entity?.getAttendancePercentageAverage(),
        "1.0-0"
      );
    }
  }
}
