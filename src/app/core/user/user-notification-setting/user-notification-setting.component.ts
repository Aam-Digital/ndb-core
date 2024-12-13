import { Component } from '@angular/core';
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { NgFor } from "@angular/common";
import { FaIconComponent, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Logging } from 'app/core/logging/logging.service';
import { eventTypes, EventType } from "app/core/config/event-types";
import { FormsModule } from '@angular/forms';
import { Angulartics2OnModule } from "angulartics2";
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

interface Notification {
  selectedOption: string;
  inputValue: string;
  toggleValue: boolean;
}

@Component({
  selector: 'app-user-notification-setting',
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
  ],
  templateUrl: './user-notification-setting.component.html',
  styleUrl: './user-notification-setting.component.scss'
})
export class UserNotificationSettingComponent {
  eventTypes: EventType[] = eventTypes;
  notifications: Notification[] = [
    { selectedOption: '', inputValue: '', toggleValue: false }
  ];

  addNewRule() {
    this.notifications.push({ selectedOption: '', inputValue: '', toggleValue: false });
  }

  removeRule(index: number) {
    this.notifications.splice(index, 1);
    // TODO: Need to add the logic to remove the rule from the backend
  }

  onEnableNotification() {
    Logging.log('Browser notifications toggled.');
  }
}
