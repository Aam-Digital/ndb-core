import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  viewChild,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MergeFieldsComponent } from "./merge-fields/merge-fields.component";
import { UserAccount } from "app/core/user/user-admin-service/user-account";
import { WarningNotOptimizedForSmallScreenComponent } from "#src/app/core/common-components/warning-not-optimized-for-small-screen/warning-not-optimized-for-small-screen.component";
import { MergeAccountSectionComponent } from "./merge-account-section/merge-account-section.component";

@Component({
  selector: "app-bulk-merge-records",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatButtonModule,
    EntityFieldEditComponent,
    ReactiveFormsModule,
    MatError,
    MatDialogClose,
    MergeFieldsComponent,
    WarningNotOptimizedForSmallScreenComponent,
    MatFormFieldModule,
    MergeAccountSectionComponent,
  ],
  templateUrl: "./bulk-merge-records.component.html",
  styleUrls: ["./bulk-merge-records.component.scss"],
})
export class BulkMergeRecordsComponent<E extends Entity> implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<BulkMergeRecordsComponent<E>>>(MatDialogRef);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly accountSection = viewChild(MergeAccountSectionComponent);

  entityConstructor: EntityConstructor;
  entitiesToMerge: E[];
  mergedEntity: E;
  fieldsToMerge: FormFieldConfig[] = [];
  mergeForm: EntityForm<E>;
  entityAccounts: (UserAccount | null)[] = [];
  accountLoadError: boolean = false;

  /** whether the entitiesToMerge contain some file attachments that would be lost during a merge */
  hasDiscardedFileOrPhoto: boolean = false;

  constructor() {
    const data = inject<{
      entityConstructor: EntityConstructor;
      entitiesToMerge: E[];
      entityAccounts?: (UserAccount | null)[];
      accountLoadError?: boolean;
    }>(MAT_DIALOG_DATA);

    this.entityConstructor = data.entityConstructor;
    this.entitiesToMerge = data.entitiesToMerge;
    this.entityAccounts = data.entityAccounts ?? [];
    this.accountLoadError = data.accountLoadError ?? false;
    // Use the primary entity's values as the base so form validators (e.g. uniqueness)
    // treat existing values as the "default" and don't incorrectly flag them as duplicates.
    this.mergedEntity = this.entitiesToMerge[0].copy() as E;
  }

  async ngOnInit(): Promise<void> {
    this.initFieldsToMerge();
    this.mergeForm = await this.entityFormService.createEntityForm(
      this.fieldsToMerge,
      this.mergedEntity,
      false,
      true,
      false,
    );
    this.cdr.detectChanges();
  }

  private initFieldsToMerge(): void {
    this.entityConstructor.schema.forEach((field, key) => {
      const hasValue = this.entitiesToMerge.some((entity) =>
        this.hasValue(entity[key]),
      );

      const isFileField =
        field.dataType === "photo" || field.dataType === "file";

      if (isFileField && this.entitiesToMerge[1][key] != null) {
        this.hasDiscardedFileOrPhoto = true;
      }

      if (field.label && hasValue && !isFileField && !field.isInternalField) {
        const formField: FormFieldConfig =
          this.entityFormService.extendFormFieldConfig(
            { id: key },
            this.entityConstructor,
          );
        this.fieldsToMerge.push({
          ...formField,
        });
      }
    });
  }

  /**
   * helper method to check whether a value is empty or has a valid value.
   */
  hasValue(value: any): boolean {
    return !(
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      value === false
    );
  }

  async confirmAndMergeRecords(): Promise<boolean> {
    this.mergeForm.formGroup.markAllAsTouched();
    if (this.mergeForm.formGroup.invalid) return false;
    if (this.accountSection()?.accountForm()?.invalid) return false;

    const accountsFound = this.entityAccounts.filter((a) => a != null);
    if (accountsFound.length > 0) {
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`:merge account warning title:Warning! User account(s) found`,
        $localize`:merge account warning:At least one selected record has a linked user account.\nIf only one record has an account, that record is kept as "Record A" and the account remains linked after merge.\nIf both records have accounts, the account linked to "Record B" will be deleted.\nAre you sure you want to continue?`,
      );
      if (!confirmed) return false;
    }

    if (this.hasDiscardedFileOrPhoto) {
      const fileIgnoreConfirmed = await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title:Warning! Some file attachments will be lost`,
        $localize`:Merge confirmation dialog with files/photos:"Record B" contains files or images. Merging currently does not support attachments yet. The merged record will only have the attachments from "record A". Files from "record B" will be lost!\nAre you sure you want to continue?`,
      );
      if (!fileIgnoreConfirmed) {
        return false;
      }
    }

    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title:Are you sure you want to merge this?`,
        $localize`:Merge confirmation dialog:Merging of two records will discard the data that is not selected to be merged. This action cannot be undone. Once the two records are merged, there will be only one record left in the system.\nAre you sure you want to continue?`,
      ))
    ) {
      return false;
    }

    try {
      await this.accountSection()?.applyAccountUpdate();
    } catch {
      await this.confirmationDialog.getConfirmation(
        $localize`:Account update error title:Account update failed`,
        $localize`:Account update error:The user account could not be updated. Please try again or contact support.`,
        OkButton,
      );
      return false;
    }

    this.dialogRef.close(
      Object.assign(
        this.entitiesToMerge[0].copy(),
        this.mergeForm.formGroup.value,
      ),
    );
  }
}
