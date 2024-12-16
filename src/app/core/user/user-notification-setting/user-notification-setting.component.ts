import { Component } from "@angular/core";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { NgFor } from "@angular/common";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { Logging } from "app/core/logging/logging.service";
import { FormsModule } from "@angular/forms";
import { Angulartics2OnModule } from "angulartics2";
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityTypeSelectorComponent } from "app/core/entity/entity-type-selector/entity-type-selector.component";

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
    MatSelect,
    MatInputModule,
    NgFor,
    FontAwesomeModule,
    FormsModule,
    MatFormFieldModule,
    MatOption,
    Angulartics2OnModule,
    MatTooltip,
    FaIconComponent,
    MatButtonModule,
    Angulartics2OnModule,
    MatTooltipModule,
    EntityTypeSelectorComponent,
  ],
  templateUrl: "./user-notification-setting.component.html",
  styleUrl: "./user-notification-setting.component.scss",
})
export class UserNotificationSettingComponent {
  notifications: Notification[] = [
    { selectedOption: "", inputValue: "", toggleValue: false },
  ];

  addNewRule() {
    this.notifications.push({
      selectedOption: "",
      inputValue: "",
      toggleValue: false,
    });
  }

  removeRule(index: number) {
    this.notifications.splice(index, 1);
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
