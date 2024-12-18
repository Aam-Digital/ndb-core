import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { environment } from "../../../environments/environment";
import { NotificationService } from "./notification.service";

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class NotificationModule {
  constructor(private notificationService: NotificationService) {
    if (environment.firebaseConfig?.enabled) {
      this.notificationService.init();
      this.notificationService.getFcmToken();
      this.notificationService.listenForMessages();
    }
  }
}
