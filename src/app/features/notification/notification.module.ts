import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { initializeApp } from "firebase/app";
import { environment } from "../../../environments/environment";
import { NotificationService } from "./notification.service";

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class NotificationModule {
  constructor(private notificationService: NotificationService) {
    initializeApp(environment.firebaseConfig);
    this.notificationService.getFcmToken();
    this.notificationService.listenForMessages();
  }
}
