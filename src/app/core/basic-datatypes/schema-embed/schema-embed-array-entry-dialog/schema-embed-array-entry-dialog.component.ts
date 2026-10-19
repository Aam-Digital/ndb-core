import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  ViewEncapsulation,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { DynamicValidatorsService } from "#src/app/core/common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { buildSchemaEmbedEntryForm } from "../schema-embed-entry-form";

/**
 * Apply the changed list of entries of a `schema-embed-array` field,
 * e.g. by saving the entity or by setting the value of the field's form control.
 *
 * Throw an error to keep the popup open (its message is displayed to the user).
 */
export type SchemaEmbedArrayApplyChange = (
  entries: Record<string, any>[],
) => Promise<void>;

/**
 * Data interface that must be given when opening the dialog
 */
export interface SchemaEmbedArrayEntryDialogData {
  /** All current entries of the field */
  entries: Record<string, any>[];
  /** Position of the entry to edit within the entries; a new entry is added if not given */
  index?: number;
  /** The inner fields of the embedded entries to edit */
  columns: FormFieldConfig[];
  /** The entity holding the embedded entries (context for the inner fields' validators) */
  entity: Entity;
  /** Whether the entry can only be viewed, not changed */
  readonly?: boolean;
  /** Called with the changed list of entries when saving or deleting the entry */
  applyChange: SchemaEmbedArrayApplyChange;
}

/**
 * Popup to view, edit or delete a single entry of a `schema-embed-array` field,
 * looking like the {@link RowDetailsComponent} popup of related entities.
 *
 * Saving or deleting the entry passes the changed list of all entries to `applyChange`
 * (deciding how to persist them) and closes the popup with that list as result.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-schema-embed-array-entry-dialog",
  templateUrl: "./schema-embed-array-entry-dialog.component.html",
  styleUrl: "./schema-embed-array-entry-dialog.component.scss",
  // no encapsulation to style the mat-form-fields nested in the field components, like EntityFormComponent does
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
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
      MatDialogRef<SchemaEmbedArrayEntryDialogComponent, Record<string, any>[]>
    >(MatDialogRef);
  private readonly dynamicValidators = inject(DynamicValidatorsService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isNew = this.data.index === undefined;

  readonly form: FormGroup = buildSchemaEmbedEntryForm(
    this.data.columns,
    this.isNew ? {} : this.data.entries[this.data.index],
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

    const entries = [...this.data.entries];
    const entry = this.form.getRawValue();
    if (this.isNew) {
      entries.push(entry);
    } else {
      entries[this.data.index] = entry;
    }
    await this.applyChange(entries);
  }

  async delete() {
    const confirmed = await this.confirmation.getConfirmation(
      $localize`:Delete confirmation title:Delete?`,
      $localize`:Delete confirmation text for an entry of an embedded table:Are you sure you want to delete this entry?`,
    );
    if (!confirmed) {
      return;
    }

    const entries = [...this.data.entries];
    entries.splice(this.data.index, 1);
    await this.applyChange(entries);
  }

  cancel() {
    // discard this form's unsaved changes
    this.unsavedChanges.setUnsavedChanges(this, false);
    this.dialogRef.close();
  }

  private async applyChange(entries: Record<string, any>[]) {
    try {
      await this.data.applyChange(entries);
      this.unsavedChanges.setUnsavedChanges(this, false);
      this.dialogRef.close(entries);
    } catch (err) {
      // e.g. validation errors of the whole property are not visible in this popup's fields, so always show an alert
      this.alertService.addDanger(err.message);
    }
  }
}
