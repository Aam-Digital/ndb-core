import { Component, OnInit } from "@angular/core";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";

@DynamicComponent("UserSecurity")
@Component({
  selector: "app-user-security",
  templateUrl: "./user-security.component.html",
  styleUrls: ["./user-security.component.scss"],
})
export class UserSecurityComponent implements OnInitDynamicComponent {
  constructor() {}

  onInitFromDynamicConfig(config: any) {}
}
