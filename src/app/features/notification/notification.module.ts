import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { environment } from "../../../environments/environment";
import { NotificationService } from "./notification.service";

/**
 * Notification center in the UI as well as support for Push Notifications
 * to actively inform users about (individually configured) events.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class NotificationModule {
  constructor(private notificationService: NotificationService) {
    if (environment.notificationsConfig?.enabled) {
      this.notificationService.init();
      this.notificationService.listenForMessages();
    }
  }
}
