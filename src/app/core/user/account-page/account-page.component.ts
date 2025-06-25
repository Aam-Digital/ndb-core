import { Component, Input, OnInit, inject } from "@angular/core";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { KeycloakUserDto } from "../user-admin-service/keycloak-user-dto";
import { Logging } from "app/core/logging/logging.service";

@Component({
  selector: "app-account-page",
  templateUrl: "./account-page.component.html",
  imports: [
    MatButtonModule,
    Angulartics2Module,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
})
export class AccountPageComponent implements OnInit {
  authService = inject(KeycloakAuthService);

  @Input() disabled: boolean;
  user: KeycloakUserDto;

  async ngOnInit() {
    try {
      this.user = await this.authService.getUserinfo();
    } catch (error) {
      Logging.debug("user profile not available", error);
    }
  }
}
