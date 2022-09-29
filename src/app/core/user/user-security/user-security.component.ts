import { Component } from "@angular/core";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { AuthService } from "../../session/auth/auth.service";
import { User } from "../user";

@DynamicComponent("UserSecurity")
@Component({
  selector: "app-user-security",
  templateUrl: "./user-security.component.html",
  styleUrls: ["./user-security.component.scss"],
})
export class UserSecurityComponent implements OnInitDynamicComponent {
  form = this.fb.group({
    username: [{ value: "", disabled: true }, Validators.required],
    email: ["", [Validators.required, Validators.email]],
    roles: new FormControl<string[]>(["user_app"]),
  });
  keycloak: KeycloakAuthService;

  constructor(private fb: FormBuilder, authService: AuthService) {
    if (authService instanceof KeycloakAuthService) {
      this.keycloak = authService;
    } else {
      this.form.disable();
    }
  }

  onInitFromDynamicConfig(config: any) {
    const user = config.entity as User;
    this.form.get("username").setValue(user.name);
  }

  createUser() {
    this.keycloak
      .createUser(
        this.form.get("username").value,
        this.form.get("email").value,
        this.form.get("roles").value
      )
      .subscribe((res) => console.log("res", res));
  }
}
