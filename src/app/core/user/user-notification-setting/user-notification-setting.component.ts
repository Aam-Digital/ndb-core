import { Component } from '@angular/core';
import { MatSlideToggle } from "@angular/material/slide-toggle";
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from "@angular/material/expansion";
import { NgFor, NgIf } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Logging } from 'app/core/logging/logging.service';
import { eventTypes, EventType } from "app/core/config/eventTypes";

@Component({
  selector: 'app-user-notification-setting',
  standalone: true,
  imports: [
    MatSlideToggle,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    NgFor,
    FontAwesomeModule,
    NgIf,
  ],
  templateUrl: './user-notification-setting.component.html',
  styleUrl: './user-notification-setting.component.scss'
})
export class UserNotificationSettingComponent {
  eventTypes: EventType[] = eventTypes;

  onOptionToggle(eventTypeId: string, option: string) {
    // TODO: Implement your logic to handle option toggle
    Logging.log(`Toggled option: ${option} for event type: ${eventTypeId}`);
  }
}
