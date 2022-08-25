import { Component, Input, OnInit } from "@angular/core";
import { AuthService } from "../../auth.service";
import { KeycloakAuthService } from "../keycloak-auth.service";

@Component({
  selector: "app-password-button",
  templateUrl: "./password-button.component.html",
  styleUrls: ["./password-button.component.scss"],
})
export class PasswordButtonComponent {
  @Input() disabled: boolean;
  keycloakAuthService: KeycloakAuthService;

  constructor(authService: AuthService) {
    if (authService instanceof KeycloakAuthService) {
      this.keycloakAuthService = authService;
    }
  }
}
