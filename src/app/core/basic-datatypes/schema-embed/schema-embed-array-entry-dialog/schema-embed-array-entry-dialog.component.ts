import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  ViewEncapsulation,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { DynamicValidatorsService } from "#src/app/core/common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { isEmptyValue } from "#src/app/utils/is-empty-value";
import { buildSchemaEmbedEntryForm } from "../schema-embed-entry-form";
import { SchemaEmbedArrayEntryChange } from "../schema-embed-array-entry-change";

/**
 * Apply the change of a single entry of a `schema-embed-array` field to its latest entries
 * (see {@link applySchemaEmbedArrayEntryChange}),
 * e.g. by saving the entity or by setting the value of the field's form control.
 *
 * Throw an error to keep the popup open (its message is displayed to the user).
 */
export type SchemaEmbedArrayApplyChange = (
  change: SchemaEmbedArrayEntryChange,
) => Promise<void>;

/**
 * Data interface that must be given when opening the dialog
 */
export interface SchemaEmbedArrayEntryDialogData {
  /** All entries of the field when opening the popup */
  entries: Record<string, any>[];
  /** Position of the entry to edit within the entries; a new entry is added if not given */
  index?: number;
  /** The inner fields of the embedded entries to edit */
  columns: FormFieldConfig[];
  /** The entity holding the embedded entries (context for the inner fields' validators) */
  entity: Entity;
  /** Whether the entry can only be viewed, not changed */
  readonly?: boolean;
  /** Called with the change of the entry when saving or deleting it */
  applyChange: SchemaEmbedArrayApplyChange;
  /**
   * Whether `applyChange` only passes the changes on to be saved later (e.g. with a surrounding form),
   * labelling the save button "Apply" instead of "Save".
   */
  deferSave?: boolean;
}

/**
 * Popup to view, edit or delete a single entry of a `schema-embed-array` field,
 * looking like the {@link RowDetailsComponent} popup of related entities.
 *
 * Saving or deleting the entry passes only that change to `applyChange`
 * (deciding how to persist it, based on the latest entries) and closes the popup with the change as result.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-schema-embed-array-entry-dialog",
  templateUrl: "./schema-embed-array-entry-dialog.component.html",
  styleUrl: "./schema-embed-array-entry-dialog.component.scss",
  // no encapsulation to style the mat-form-fields nested in the field components, like EntityFormComponent does
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule, // importing FormsModule prevents native form submission / page reload (e.g. pressing Enter in a field)
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatMenuModule,
    DialogCloseComponent,
    EntityFieldEditComponent,
    FaDynamicIconComponent,
  ],
})
export class SchemaEmbedArrayEntryDialogComponent {
  protected readonly data =
    inject<SchemaEmbedArrayEntryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<
      MatDialogRef<
        SchemaEmbedArrayEntryDialogComponent,
        SchemaEmbedArrayEntryChange
      >
    >(MatDialogRef);
  private readonly dynamicValidators = inject(DynamicValidatorsService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isNew = this.data.index === undefined;

  /** The edited entry as it was when opening the popup */
  private readonly original: Record<string, any> | undefined = this.isNew
    ? undefined
    : this.data.entries[this.data.index];

  readonly form: FormGroup = buildSchemaEmbedEntryForm(
    this.data.columns,
    this.original ?? {},
    this.dynamicValidators,
    this.data.entity,
  );

  constructor() {
    if (this.data.readonly) {
      this.form.disable();
    }

    // same as the popup of related entities: ask before discarding changes when clicking outside
    this.dialogRef.disableClose = true;
    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed())
      .subscribe(async () => {
        if (await this.unsavedChanges.checkUnsavedChanges(this)) {
          this.dialogRef.close();
        }
      });
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.unsavedChanges.setUnsavedChanges(this, this.form.dirty),
      );
    this.destroyRef.onDestroy(() =>
      this.unsavedChanges.setUnsavedChanges(this, false),
    );
  }

  async save() {
    // errors regarding invalid fields won't be displayed unless marked as touched
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const entry = this.form.getRawValue();
    if (this.isNew && Object.values(entry).every(isEmptyValue)) {
      // nothing entered, don't add a blank entry
      this.cancel();
      return;
    }

    await this.applyChange({
      entry,
      index: this.data.index,
      original: this.original,
    });
  }

  async delete() {
    const confirmed = await this.confirmation.getConfirmation(
      $localize`:Delete confirmation title:Delete?`,
      $localize`:Delete confirmation text for an entry of an embedded table:Are you sure you want to delete this entry?`,
    );
    if (!confirmed) {
      return;
    }

    await this.applyChange({
      delete: true,
      index: this.data.index,
      original: this.original,
    });
  }

  cancel() {
    // discard this form's unsaved changes
    this.unsavedChanges.setUnsavedChanges(this, false);
    this.dialogRef.close();
  }

  private async applyChange(change: SchemaEmbedArrayEntryChange) {
    try {
      await this.data.applyChange(change);
      this.unsavedChanges.setUnsavedChanges(this, false);
      this.dialogRef.close(change);
    } catch (err) {
      // e.g. validation errors of the whole property are not visible in this popup's fields, so always show an alert
      this.alertService.addDanger(err.message);
    }
  }
}
