import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { MergeFieldsComponent } from "./merge-fields/merge-fields.component";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import {
  Role,
  UserAccount,
} from "app/core/user/user-admin-service/user-account";
import { WarningNotOptimizedForSmallScreenComponent } from "#src/app/core/common-components/warning-not-optimized-for-small-screen/warning-not-optimized-for-small-screen.component";
import { lastValueFrom } from "rxjs";

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
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: "./bulk-merge-records.component.html",
  styleUrls: ["./bulk-merge-records.component.scss"],
})
export class BulkMergeRecordsComponent<E extends Entity> implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<BulkMergeRecordsComponent<E>>>(MatDialogRef);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly userAdminService = inject(UserAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  entityConstructor: EntityConstructor;
  entitiesToMerge: E[];
  mergedEntity: E;
  fieldsToMerge: FormFieldConfig[] = [];
  mergeForm: EntityForm<E>;
  entityAccounts: (UserAccount | null)[] = [];

  /** Reactive form for editing the surviving account's email and roles */
  accountForm: FormGroup | null = null;
  availableRoles: Role[] = [];
  selectedAccountEmailIndex: number | null = null;

  /** whether the entitiesToMerge contain some file attachments that would be lost during a merge */
  hasDiscardedFileOrPhoto: boolean = false;

  get hasAnyUserAccount(): boolean {
    return this.entityAccounts.some((a) => a != null);
  }

  get accountEmailControl(): FormControl {
    return this.accountForm?.get("email") as FormControl;
  }

  get accountRolesControl(): FormControl {
    return this.accountForm?.get("roles") as FormControl;
  }

  formatRoles(account: UserAccount | null | undefined): string {
    if (!account?.roles?.length) return "-";
    return account.roles.map((r) => r.name).join(", ");
  }

  hasAccountEmail(index: number): boolean {
    return !!this.entityAccounts[index]?.email;
  }

  isAccountEmailSelected(index: number): boolean {
    return this.selectedAccountEmailIndex === index;
  }

  selectAccountEmail(index: number): void {
    if (!this.hasAccountEmail(index)) {
      return;
    }

    this.selectedAccountEmailIndex = index;
    this.accountEmailControl?.setValue(this.entityAccounts[index]?.email);
    this.accountEmailControl?.markAsDirty();
  }

  hasAccountRoles(index: number): boolean {
    return this.getAccountRoles(index).length > 0;
  }

  isAccountRolesSelected(index: number): boolean {
    const selectedRoles = (this.accountRolesControl?.value ?? []) as Role[];
    const selectedRoleIds = new Set(selectedRoles.map((r) => r.id));
    const accountRoles = this.getAccountRoles(index);

    if (!accountRoles.length) {
      return false;
    }

    return accountRoles.every((role) => selectedRoleIds.has(role.id));
  }

  toggleAccountRoles(index: number, checked: boolean): void {
    const selectedRoles = (this.accountRolesControl?.value ?? []) as Role[];
    const accountRoles = this.getAccountRoles(index);
    if (!accountRoles.length) return;

    const selectedMap = new Map(selectedRoles.map((r) => [r.id, r]));
    if (checked) {
      accountRoles.forEach((role) => selectedMap.set(role.id, role));
    } else {
      accountRoles.forEach((role) => selectedMap.delete(role.id));
    }

    this.accountRolesControl?.setValue(Array.from(selectedMap.values()));
    this.accountRolesControl?.markAsDirty();
  }

  constructor() {
    const data = inject<{
      entityConstructor: EntityConstructor;
      entitiesToMerge: E[];
      entityAccounts?: (UserAccount | null)[];
    }>(MAT_DIALOG_DATA);

    this.entityConstructor = data.entityConstructor;
    this.entitiesToMerge = data.entitiesToMerge;
    this.entityAccounts = data.entityAccounts ?? [];
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
    // Render merge preview immediately once core form is ready.
    this.cdr.detectChanges();

    if (this.hasAnyUserAccount) {
      await this.initAccountForm();
      // Refresh account section after async role/account control initialization.
      this.cdr.detectChanges();
    }
  }

  private async initAccountForm(): Promise<void> {
    const primaryAccount = this.entityAccounts[0];

    try {
      this.availableRoles = await lastValueFrom(
        this.userAdminService.getAllRoles(),
      );
    } catch {
      this.availableRoles = this.uniqueRoles(
        this.entityAccounts.flatMap((account) => account?.roles ?? []),
      );
    }

    // Map the current roles to available role objects to ensure reference equality for mat-select.
    const currentRoles = this.getAccountRoles(0);

    this.accountForm = this.fb.group({
      email: [primaryAccount?.email ?? "", [Validators.email]],
      roles: new FormControl<Role[]>(currentRoles),
    });

    this.selectedAccountEmailIndex = this.hasAccountEmail(0)
      ? 0
      : this.hasAccountEmail(1)
        ? 1
        : null;
    this.accountEmailControl?.valueChanges.subscribe((value) => {
      if (value === this.entityAccounts[0]?.email) {
        this.selectedAccountEmailIndex = 0;
      } else if (value === this.entityAccounts[1]?.email) {
        this.selectedAccountEmailIndex = 1;
      } else {
        this.selectedAccountEmailIndex = null;
      }
    });
  }

  private getAccountRoles(index: number): Role[] {
    return this.uniqueRoles(
      (this.entityAccounts[index]?.roles ?? []).map(
        (role) =>
          this.availableRoles.find(
            (availableRole) => availableRole.id === role.id,
          ) ?? role,
      ),
    );
  }

  private uniqueRoles(roles: Role[]): Role[] {
    const roleMap = new Map(roles.map((role) => [role.id, role]));
    return Array.from(roleMap.values());
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

    if (this.hasDiscardedFileOrPhoto) {
      const fileIgnoreConfirmed = await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title:Warning! Some file attachments will be lost`,
        $localize`:Merge confirmation dialog with files/photos:"Record B" contains files or images. Merging currently does not support attachments yet. The merged record will only have the attachments from "record A". Files from "record B" will be lost!\nAre you sure you want to continue?`,
      );
      if (!fileIgnoreConfirmed) {
        return false;
      }
    }

    let confirmationMessage = $localize`:Merge confirmation dialog:Merging of two records will discard the data that is not selected to be merged. This action cannot be undone. Once the two records are merged, there will be only one record left in the system.\nAre you sure you want to continue?`;
    if (
      !(await this.confirmationDialog.getConfirmation(
        $localize`:Merge confirmation title:Are you sure you want to merge this?`,
        confirmationMessage,
      ))
    ) {
      return false;
    }

    await this.applyAccountUpdate();

    this.dialogRef.close(
      Object.assign(
        this.entitiesToMerge[0].copy(),
        this.mergeForm.formGroup.value,
      ),
    );
  }

  /**
   * Applies any edits made to the surviving account's email/roles via userAdminService.
   */
  private async applyAccountUpdate(): Promise<void> {
    const primaryAccount = this.entityAccounts[0];
    if (!primaryAccount?.id || !this.accountForm?.dirty) return;

    const formValue = this.accountForm.getRawValue();
    const update: Partial<UserAccount> = {};

    if (formValue.email !== primaryAccount.email) {
      update.email = formValue.email;
    }
    if (
      JSON.stringify(formValue.roles) !== JSON.stringify(primaryAccount.roles)
    ) {
      update.roles = formValue.roles;
    }

    if (Object.keys(update).length > 0) {
      await lastValueFrom(
        this.userAdminService.updateUser(primaryAccount.id, update),
      );
    }
  }
}
