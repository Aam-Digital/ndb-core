import { Component, Input, OnInit } from "@angular/core";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { AlertService } from "../../alerts/alert.service";
import { MatButtonModule } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { Angulartics2Module } from "angulartics2";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { KeycloakUserDto } from "../user-admin-service/keycloak-user-dto";
import { Logging } from "app/core/logging/logging.service";
import { lastValueFrom } from "rxjs";

@Component({
  selector: "app-account-page",
  templateUrl: "./account-page.component.html",
  imports: [
    MatButtonModule,
    NgIf,
    Angulartics2Module,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
})
export class AccountPageComponent implements OnInit {
  @Input() disabled: boolean;
  email = new FormControl("", [Validators.required, Validators.email]);
  user: KeycloakUserDto;

  constructor(
    public authService: KeycloakAuthService,
    private alertService: AlertService,
    private userAdminService: UserAdminService,
  ) {}

  async ngOnInit() {
    if (this.disabled) {
      this.email.disable();
    }
    try {
      this.user = await this.authService.getUserinfo();
      this.email.setValue(this.user.email);
    } catch (error) {
      Logging.debug("user profile not available", error);
    }
  }

  async setEmail() {
    if (this.email.invalid) {
      return;
    }

    try {
      await lastValueFrom(
        this.userAdminService.updateUser(this.user.id, {
          email: this.email.value,
        }),
      );
      this.alertService.addInfo(
        $localize`Please click the link in the email we sent you to verify your email address.`,
      );
    } catch (err) {
      this.email.setErrors({ other: err?.error?.message });
    }
  }
}
