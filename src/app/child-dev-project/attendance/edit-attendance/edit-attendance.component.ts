import { Component, Input, OnInit } from "@angular/core";
import { EditComponent } from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { EditEntityArrayComponent } from "../../../core/entity-components/entity-select/edit-entity-array/edit-entity-array.component";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { startWith } from "rxjs/operators";
import { FormControl } from "@angular/forms";
import { InteractionType } from "../../notes/model/interaction-type.interface";
import { NgForOf, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DisplayEntityComponent } from "../../../core/entity-components/entity-select/display-entity/display-entity.component";
import { MatButtonModule } from "@angular/material/button";
import { AttendanceStatusSelectComponent } from "../attendance-status-select/attendance-status-select.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { Note } from "../../notes/model/note";
import { EventAttendance } from "../model/event-attendance";
import { MatCardModule } from "@angular/material/card";

@UntilDestroy()
@DynamicComponent("EditAttendance")
@Component({
  selector: "app-edit-attendance",
  standalone: true,
  imports: [
    EditEntityArrayComponent,
    NgIf,
    NgForOf,
    FontAwesomeModule,
    DisplayEntityComponent,
    MatButtonModule,
    AttendanceStatusSelectComponent,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  templateUrl: "./edit-attendance.component.html",
  styleUrls: ["./edit-attendance.component.scss"],
})
export class EditAttendanceComponent
  extends EditComponent<string[]>
  implements OnInit
{
  showAttendance = false;
  mobile = false;
  @Input() entity: Note;
  attendanceForm: FormControl<Map<string, EventAttendance>>;

  constructor(screenWithObserver: ScreenWidthObserver) {
    super();
    screenWithObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe((isDesktop) => (this.mobile = !isDesktop));
  }

  ngOnInit() {
    super.ngOnInit();
    const category = this.parent.get(
      "category",
    ) as FormControl<InteractionType>;
    if (category) {
      category.valueChanges.pipe(startWith(category.value)).subscribe((val) => {
        this.showAttendance = !!val?.isMeeting;
        if (this.showAttendance) {
          this.attendanceForm = new FormControl(
            this.entity.copy()["childrenAttendance"],
          );
          this.parent.addControl("childrenAttendance", this.attendanceForm);
        } else {
          this.parent.removeControl("childrenAttendance");
          this.attendanceForm = undefined;
        }
      });
    }
  }

  getAttendance(childId: string) {
    let attendance = this.attendanceForm.value.get(childId);
    if (!attendance) {
      attendance = new EventAttendance();
      this.attendanceForm.value.set(childId, attendance);
    }
    return attendance;
  }

  removeChild(id: string) {
    const children = this.formControl.value;
    const index = children.indexOf(id);
    children.splice(index, 1);
    this.attendanceForm.value.delete(id);
    this.formControl.setValue([...children]);
    this.formControl.markAsDirty();
  }

  updateAttendanceValue(childId, property: "status" | "remarks", newValue) {
    this.getAttendance(childId)[property] = newValue;
    this.formControl.markAsDirty();
  }
}
