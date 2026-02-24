import { Component, inject, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { startWith } from "rxjs/operators";
import { EditEntityComponent } from "#src/app/core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { ScreenWidthObserver } from "#src/app/utils/media/screen-size-observer.service";
import { InteractionType } from "#src/app/child-dev-project/notes/model/interaction-type.interface";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { AttendanceStatusSelectComponent } from "./attendance-status-select/attendance-status-select.component";
import { AttendanceItem } from "../model/attendance-item";

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
    MatInputModule,
    MatCardModule,
  ],
  templateUrl: "./edit-attendance.component.html",
  styleUrls: ["./edit-attendance.component.scss"],
  // TODO: refactor this to use signals and be ready for OnPush change detection
  //changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatFormFieldControl, useExisting: EditAttendanceComponent },
  ],
})
export class EditAttendanceComponent
  extends CustomFormControlDirective<string[]>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Note;

  showAttendance = false;
  mobile = false;

  get formControl(): FormControl<string[]> {
    return this.ngControl.control as FormControl<string[]>;
  }

  get parent() {
    return this.formControl.parent as FormGroup;
  }

  constructor() {
    super();
    const screenWithObserver = inject(ScreenWidthObserver);

    screenWithObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe((isDesktop) => (this.mobile = !isDesktop));
  }

  ngOnInit() {
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
      attendance = new AttendanceItem();
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
