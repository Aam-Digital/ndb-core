import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";

/**
 * Reusable user account details form component.
 * Used by EntityUserComponent and ProfileComponent for consistent user management UI.
 */
@UntilDestroy()
@Component({
  selector: "app-user-details",
  templateUrl: "./user-details.component.html",
  styleUrls: ["./user-details.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
})
export class UserDetailsComponent {
  private fb = inject(FormBuilder);

  userAccount = input<UserAccount | null>();
  availableRoles = input<Role[]>([]);
  showPasswordChange = input<boolean>(false);
  disabled = input<boolean>(false);

  formSubmit = output<Partial<UserAccount>>();
  formCancel = output<void>();

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      roles: new FormControl<Role[]>([], Validators.required),
    });

    // Auto-trim whitespace from email
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((next) => {
      if (next.email?.startsWith(" ") || next.email?.endsWith(" ")) {
        this.form
          .get("email")
          ?.setValue(next.email.trim(), { emitEvent: false });
      }
    });

    effect(() => {
      const user = this.userAccount();
      if (user) {
        this.updateFormFromUser(user);
      }
    });

    effect(() => {
      if (this.disabled()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  private updateFormFromUser(user: UserAccount) {
    this.form.patchValue(
      {
        email: user.email,
        roles: (user.roles ?? []).map((role) =>
          this.availableRoles().find((r) => r.id === role.id),
        ),
      },
      { emitEvent: false },
    );
    this.form.markAsPristine();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    this.formSubmit.emit(formValue);
  }

  onCancel() {
    this.formCancel.emit();
  }

  getFormError(field: string, errorType: string): boolean {
    return this.form.get(field)?.hasError(errorType) ?? false;
  }

  getGlobalError(): string | null {
    return this.form.getError("failed");
  }

  setGlobalError(message: string) {
    this.form.setErrors({ failed: message });
  }

  clearErrors() {
    this.form.setErrors({});
  }
}
