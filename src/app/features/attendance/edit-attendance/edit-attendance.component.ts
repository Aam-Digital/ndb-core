import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EditEntityComponent } from "#src/app/core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { ScreenWidthObserver } from "#src/app/utils/media/screen-size-observer.service";
import { AttendanceStatusSelectComponent } from "./attendance-status-select/attendance-status-select.component";
import { AttendanceItem } from "../model/attendance-item";

/**
 * Edit component for the `attendance` datatype.
 *
 * Manages an array of {@link AttendanceItem} objects, each with a participant entity reference,
 * attendance status, and remarks.
 *
 * Participants can be of any entity type configured via the field's `additional.participant.additional`.
 */
@DynamicComponent("EditAttendance")
@Component({
  selector: "app-edit-attendance",
  imports: [
    NgTemplateOutlet,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatFormFieldControl, useExisting: EditAttendanceComponent },
  ],
})
export class EditAttendanceComponent
  extends CustomFormControlDirective<AttendanceItem[]>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;

  private readonly destroyRef = inject(DestroyRef);
  private readonly screenWidthObserver = inject(ScreenWidthObserver);
  private readonly changeDetector = inject(ChangeDetectorRef);

  mobile = false;

  /** Internal form control for the entity autocomplete to add new participants */
  addParticipantControl = new FormControl<string>(null);

  /** FormFieldConfig for the internal entity autocomplete */
  participantFieldConfig: FormFieldConfig;

  /** Filter to exclude already-added participants from the autocomplete */
  participantFilter: WritableSignal<(e: Entity) => boolean> = signal(
    () => true,
  );

  get formControl(): FormControl<AttendanceItem[]> {
    return this.ngControl.control as FormControl<AttendanceItem[]>;
  }

  ngOnInit() {
    this.screenWidthObserver
      .platform()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isDesktop) => (this.mobile = !isDesktop));

    // Build the config for the participant entity autocomplete
    // from the nested `additional.participant` schema config
    const participantConfig = this.formFieldConfig?.additional?.participant;
    this.participantFieldConfig = {
      id: "participant",
      label: $localize`:Placeholder for adding a participant:Select additional participant`,
      dataType: "entity",
      additional: participantConfig?.additional,
    };

    // Whenever a new participant is selected in the autocomplete, add them
    this.addParticipantControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedId) => {
        if (selectedId) {
          this.addParticipant(selectedId);
          this.addParticipantControl.setValue(null, { emitEvent: false });
        }
      });

    // Re-render when the form control value or status changes externally (e.g. loading entity data, switching between view/edit mode)
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateParticipantFilter();
        this.changeDetector.markForCheck();
      });
    this.formControl.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.changeDetector.markForCheck());

    this.updateParticipantFilter();
  }

  private updateParticipantFilter() {
    const currentIds = new Set(
      (this.formControl.value ?? []).map((item) => item.participant),
    );
    this.participantFilter.set((e: Entity) => !currentIds.has(e.getId()));
  }

  addParticipant(participantId: string) {
    const current = this.formControl.value ?? [];
    // Prevent duplicates
    if (current.some((item) => item.participant === participantId)) {
      return;
    }
    const newItem = new AttendanceItem(undefined, "", participantId);
    this.formControl.setValue([...current, newItem]);
    this.formControl.markAsDirty();
  }

  removeParticipant(participantId: string) {
    const current = this.formControl.value ?? [];
    this.formControl.setValue(
      current.filter((item) => item.participant !== participantId),
    );
    this.formControl.markAsDirty();
  }

  updateAttendanceValue(
    participantId: string,
    property: "status" | "remarks",
    newValue: any,
  ) {
    const current = this.formControl.value ?? [];
    const updatedArray = current.map((item) => {
      if (item.participant !== participantId) {
        return item;
      }
      const updatedItem = item.copy();
      updatedItem[property] = newValue;
      return updatedItem;
    });
    this.formControl.setValue(updatedArray);
    this.formControl.markAsDirty();
  }

  getAttendanceItem(participantId: string): AttendanceItem | undefined {
    return (this.formControl.value ?? []).find(
      (item) => item.participant === participantId,
    );
  }
}
