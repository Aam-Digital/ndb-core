import { Component, Input } from "@angular/core";
import { AuthService } from "../../auth.service";
import { KeycloakAuthService } from "../keycloak-auth.service";

@Component({
  selector: "app-account-page",
  templateUrl: "./account-page.component.html",
})
export class AccountPageComponent {
  @Input() disabled: boolean;
  keycloakAuthService: KeycloakAuthService;

  constructor(authService: AuthService) {
    if (authService instanceof KeycloakAuthService) {
      this.keycloakAuthService = authService;
    }
  }
}
