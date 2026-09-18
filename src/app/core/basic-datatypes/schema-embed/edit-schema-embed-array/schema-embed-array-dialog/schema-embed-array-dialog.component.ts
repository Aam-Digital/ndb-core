import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";

export interface SchemaEmbedArrayDialogData {
  /** The field's FormControl - read once for the dialog's initial rows, written once on close. */
  formControl: FormControl<Record<string, any>[]>;
  /** The inner fields (table columns), resolved from the field's schema-embed configuration. */
  columns: FormFieldConfig[];
  /** Dialog title, typically the field's own label. */
  label?: string;
}

/**
 * Popup for editing a `schema-embed-array` field: a full table of all entries,
 * with add/remove-row actions and one generic {@link EntityFieldEditComponent} per cell.
 *
 * The dialog is modal, so nothing outside it can observe or change the field's FormControl
 * while it's open - edits accumulate purely locally (on `rowsArray`) for the dialog's whole
 * lifetime, and are written back to the FormControl in one shot right before the dialog
 * closes. There is no separate save/cancel step here, the outer entity form's own Save/Cancel
 * still governs persisting or discarding.
 */
@Component({
  selector: "app-schema-embed-array-dialog",
  imports: [
    ReactiveFormsModule,
    EntityFieldEditComponent,
    MatButtonModule,
    MatDialogModule,
    DialogCloseComponent,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  templateUrl: "./schema-embed-array-dialog.component.html",
  styleUrls: ["./schema-embed-array-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaEmbedArrayDialogComponent {
  protected readonly data = inject<SchemaEmbedArrayDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<SchemaEmbedArrayDialogComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly formControl = this.data.formControl;
  protected readonly columns = this.data.columns;

  /**
   * The field's disabled state as of when the dialog opened. Read once, not tracked live: the
   * trigger button that opens this dialog is itself natively `[disabled]`, so this can only
   * ever be `false` in practice - but every row still honors it defensively, in case that ever
   * changes.
   */
  protected readonly isDisabled = this.formControl.disabled;

  /** One FormGroup per row, built once from the field's value as of when the dialog opened. */
  private readonly rowsArray = new FormArray<FormGroup>(
    (this.formControl.value ?? []).map((value) =>
      this.buildRowFormGroup(value),
    ),
  );

  /**
   * Reactive view of rowsArray's rows, for the template. Seeded with a copy - `rowsArray.controls`
   * is a live array that `push`/`removeAt` mutate in place, which would otherwise double-apply
   * every change once addRow/removeRow also update this signal.
   */
  rows = signal<FormGroup[]>([...this.rowsArray.controls]);

  constructor() {
    // write the accumulated edits back to the field's FormControl in one shot, right before the
    // dialog closes (however it closes - the Close button, the X, or Esc). Skipped entirely if
    // nothing was actually added/removed/edited, so opening and closing without touching
    // anything doesn't spuriously dirty the outer entity form.
    this.dialogRef
      .beforeClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.rowsArray.dirty) {
          this.formControl.setValue(this.rowsArray.getRawValue());
          this.formControl.markAsDirty();
        }
      });
  }

  addRow() {
    const formGroup = this.buildRowFormGroup({});
    this.rowsArray.push(formGroup);
    this.rowsArray.markAsDirty();
    this.rows.set([...this.rows(), formGroup]);
  }

  removeRow(index: number) {
    this.rowsArray.removeAt(index);
    this.rowsArray.markAsDirty();
    const updated = [...this.rows()];
    updated.splice(index, 1);
    this.rows.set(updated);
  }

  private buildRowFormGroup(value: Record<string, any>): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const column of this.columns) {
      controls[column.id] = new FormControl(value?.[column.id]);
    }
    const formGroup = new FormGroup(controls);
    if (this.isDisabled) {
      formGroup.disable({ emitEvent: false });
    }
    return formGroup;
  }
}
