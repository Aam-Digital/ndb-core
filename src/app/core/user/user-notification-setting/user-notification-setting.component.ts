import { Component } from "@angular/core";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
import { NgFor, NgIf } from "@angular/common";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
import { FormsModule, FormControl } from "@angular/forms";
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";

interface Notification {
  selectedOption: string;
  inputValue: string;
  toggleValue: boolean;
}

@Component({
  selector: "app-user-notification-setting",
  standalone: true,
  imports: [
    MatSlideToggle,
    MatInputModule,
    NgFor,
    FontAwesomeModule,
    FormsModule,
    MatFormFieldModule,
    MatTooltip,
    FaIconComponent,
    MatButtonModule,
    MatTooltipModule,
    NgIf,
    EntityTypeSelectComponent,
    HelpButtonComponent,
  ],
  templateUrl: "./user-notification-setting.component.html",
  styleUrl: "./user-notification-setting.component.scss",
})
export class UserNotificationSettingComponent {
  notificationRule: Notification[] = [
    { selectedOption: "", inputValue: "", toggleValue: false },
  ];
  formControl = new FormControl();

  addNewRule() {
    // TODO: Implement the logic to update the new field and save all the field value in the form control and update in the backend.
    this.notificationRule.push({
      selectedOption: "",
      inputValue: "",
      toggleValue: false,
    });
  }

  removeRule(index: number) {
    this.notificationRule.splice(index, 1);
    // TODO: Need to add the logic to remove the rule from the backend
  }

  onEnableNotification() {
    // TODO: Implement the logic to enable the notification for user and update the value in CouchDB backend.
    Logging.log("Browser notifications toggled.");
  }

  updateNotificationRule() {
    // TODO: Implement the logic to update the notification rule in the backend
    Logging.log("Notification settings saved.");
  }

  cancelNotificationRule() {
    // TODO: Implement the logic to cancel the notification rule and not need to do update anything
    Logging.log("Notification settings canceled.");
  }
}
