import { Component, Input, OnInit, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { startWith } from "rxjs/operators";
import { EditEntityComponent } from "../../../core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../core/entity/default-datatype/edit-component";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { InteractionType } from "../../notes/model/interaction-type.interface";
import { Note } from "../../notes/model/note";
import { AttendanceStatusSelectComponent } from "../attendance-status-select/attendance-status-select.component";
import { EventAttendance } from "../model/event-attendance";

@UntilDestroy()
@DynamicComponent("EditAttendance")
@Component({
  selector: "app-edit-attendance",
  imports: [
    ReactiveFormsModule,
    EditEntityComponent,
    FontAwesomeModule,
    EntityBlockComponent,
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
  entityFormGroup: FormGroup;

  @Input() declare entity: Note;

  constructor() {
    const screenWithObserver = inject(ScreenWidthObserver);

    super();

    // Create a FormGroup with the participants control that syncs with this component's formControl
    // TODO: NOW WORKING YET
    this.entityFormGroup = new FormGroup({
      participants: this.formControl,
    });

    screenWithObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe((isDesktop) => (this.mobile = !isDesktop));
  }

  override ngOnInit() {
    super.ngOnInit();
    const category = this.parent.get(
      "category",
    ) as FormControl<InteractionType>;
    if (category) {
      category.valueChanges.pipe(startWith(category.value)).subscribe((val) => {
        this.showAttendance = !!val?.isMeeting;
        if (this.showAttendance) {
          let childrenAttendanceForm = new FormControl(
            this.entity.copy()["childrenAttendance"],
          );
          this.parent.addControl("childrenAttendance", childrenAttendanceForm);
        } else {
          this.parent.removeControl("childrenAttendance");
        }
      });
    }
  }

  getAttendance(childId: string) {
    let attendance = this.parent.get("childrenAttendance").value.get(childId);
    if (!attendance) {
      attendance = new EventAttendance();
      this.parent.get("childrenAttendance").value.set(childId, attendance);
    }
    return attendance;
  }

  removeChild(id: string) {
    const children = this.formControl.value;
    const index = children.indexOf(id);
    children.splice(index, 1);
    this.parent.get("childrenAttendance").value.delete(id);
    this.formControl.markAsDirty();
    this.formControl.setValue([...children]);
  }

  updateAttendanceValue(childId, property: "status" | "remarks", newValue) {
    this.formControl.markAsDirty();
    this.getAttendance(childId)[property] = newValue;
  }
}
