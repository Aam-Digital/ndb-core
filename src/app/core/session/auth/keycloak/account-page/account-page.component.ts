import { Component, Input, OnInit } from "@angular/core";
import { KeycloakAuthService } from "../keycloak-auth.service";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { AlertService } from "../../../../alerts/alert.service";
import { MatButtonModule } from "@angular/material/button";
import { NgIf } from "@angular/common";
import { Angulartics2Module } from "angulartics2";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

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
  standalone: true,
})
export class AccountPageComponent implements OnInit {
  @Input() disabled: boolean;
  email = new FormControl("", [Validators.required, Validators.email]);

  constructor(
    public authService: KeycloakAuthService,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    if (this.disabled) {
      this.email.disable();
    }
    this.authService
      .getUserinfo()
      .then((res) => this.email.setValue(res.email))
      .catch((err) => console.debug("user profile not available", err));
  }

  setEmail() {
    if (this.email.invalid) {
      return;
    }

    this.authService.setEmail(this.email.value).subscribe({
      next: () =>
        this.alertService.addInfo(
          $localize`Please click the link in the email we sent you to verify your email address.`,
        ),
      error: (err) => this.email.setErrors({ other: err.error.message }),
    });
  }
}
