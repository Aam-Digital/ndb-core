import {
  Component,
  inject,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
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
import { EditConfigurableEnumComponent } from "#src/app/core/basic-datatypes/configurable-enum/edit-configurable-enum/edit-configurable-enum.component";
import { ConfigurableEnumValue } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { ATTENDANCE_STATUS_CONFIG_ID, AttendanceStatusType } from "../model/attendance-status";
import { AttendanceItem } from "../model/attendance-item";

/**
 * @deprecated Use the new {@link EditAttendanceComponent} with the `attendance` datatype instead.
 * This component is kept for backward compatibility with the Note entity's legacy attendance format.
 */
@UntilDestroy()
@DynamicComponent("EditLegacyAttendance")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-legacy-attendance",
  imports: [
    ReactiveFormsModule,
    EditEntityComponent,
    FontAwesomeModule,
    EntityBlockComponent,
    MatButtonModule,
    EditConfigurableEnumComponent,
    MatInputModule,
    MatCardModule,
  ],
  templateUrl: "./edit-legacy-attendance.component.html",
  styleUrls: ["./edit-legacy-attendance.component.scss"],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditLegacyAttendanceComponent,
    },
  ],
})
export class EditLegacyAttendanceComponent
  extends CustomFormControlDirective<string[]>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Note;

  showAttendance = false;
  mobile = false;

  readonly statusFieldConfig: FormFieldConfig = {
    id: "status",
    dataType: "configurable-enum",
    additional: ATTENDANCE_STATUS_CONFIG_ID,
  };
  private readonly statusControls = new Map<
    string,
    FormControl<ConfigurableEnumValue>
  >();

  getStatusControl(childId: string): FormControl<ConfigurableEnumValue> {
    let ctrl = this.statusControls.get(childId);
    if (!ctrl) {
      ctrl = new FormControl<ConfigurableEnumValue>(
        this.getAttendance(childId).status ?? null,
      );
      ctrl.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
        this.updateAttendanceValue(childId, "status", value as AttendanceStatusType);
      });
      this.statusControls.set(childId, ctrl);
    }
    return ctrl;
  }

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
      category.valueChanges
        .pipe(startWith(category.value), untilDestroyed(this))
        .subscribe((val) => {
          this.showAttendance = !!val?.isMeeting;
          if (this.showAttendance) {
            let childrenAttendanceForm = new FormControl(
              this.entity.copy()["childrenAttendance"],
            );
            this.parent.addControl(
              "childrenAttendance",
              childrenAttendanceForm,
            );
          } else {
            this.parent.removeControl("childrenAttendance");
          }
        });
    }
  }

  getAttendance(childId: string) {
    const attendanceList: AttendanceItem[] =
      this.parent.get("childrenAttendance").value;
    let attendance = attendanceList.find(
      (item) => item.participant === childId,
    );
    if (!attendance) {
      attendance = new AttendanceItem();
      attendance.participant = childId;
      attendanceList.push(attendance);
    }
    return attendance;
  }

  removeChild(id: string) {
    const children = this.formControl.value;
    const index = children.indexOf(id);
    if (index < 0) {
      return;
    }
    children.splice(index, 1);
    const attendanceList: AttendanceItem[] =
      this.parent.get("childrenAttendance").value;
    const attIndex = attendanceList.findIndex(
      (item) => item.participant === id,
    );
    if (attIndex >= 0) {
      attendanceList.splice(attIndex, 1);
    }
    this.formControl.markAsDirty();
    this.formControl.setValue([...children]);
  }

  updateAttendanceValue(childId, property: "status" | "remarks", newValue) {
    this.formControl.markAsDirty();
    this.getAttendance(childId)[property] = newValue;
  }
}
