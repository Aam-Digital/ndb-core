import { Injectable } from '@angular/core';
import { environment } from "./environments/environment";
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Logging } from 'app/core/logging/logging.service';
import { HttpClient } from "@angular/common/http";
import { NotificationActivity } from './app/features/notifications/model/notifications-activity';
import { CurrentUserSubject } from 'app/core/session/current-user-subject';
import { EntityMapperService } from './app/core/entity/entity-mapper/entity-mapper.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseNotificationService {
  private messaging: any = null;

  constructor(private httpClient: HttpClient, private entityMapper: EntityMapperService, private currentUser: CurrentUserSubject) {
    firebase.initializeApp(environment.firebase);
    this.messaging = firebase.messaging();
  }

  /**
   * Request permission for Firebase messaging and retrieve the token.
   */
  async getFcmToken(): Promise<any> {
    try {
      Logging.log("Requesting permission for Firebase messaging...");
      const currentToken = await getToken(this.messaging, { vapidKey: environment.firebase.vapidKey });
      if (currentToken) {
        Logging.log(currentToken);
        Logging.log("FCM Token Generated");
        return currentToken;
      } else {
        Logging.log("No registration token available. Request permission to generate one.");
      }
    } catch (err) {
      Logging.error("An error occurred while retrieving token: ", err);
    }
  }

  listenForMessages() {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      const { notification } = payload;
      
      if (notification) {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon
        });
      }
    });
  }

  async sendNotification() {
    const fcmToken = await this.getFcmToken();
    if (fcmToken) {
      this.sendNotificationToUser(fcmToken).subscribe((data) => {
        Logging.log(data);
        Logging.log("Notification sent to user");
      });
    } else {
      Logging.error("FCM Token is undefined. Notification not sent.");
    }
  }

  sendNotificationToUser(fcmToken: string) {
    const fcmGoogleApiUrl = `https://fcm.googleapis.com/v1/projects/${environment.firebase.projectId}/messages:send`
    const headers = {
      Authorization: `Bearer ya29.c.c0ASRK0GZRk6GGGy841mqPHMEAdl_ytTUZua5HDp9SIiwxURsnhsochgMiRkuHyiD3UTsSdb-GK7eTzX-epnZMB8xD37tkpaxSXD043Kc6PIE8zG8OMjUBA6isYbtxRwSTGj3xYHM6EbVuoIUqNg5Q3ph20lPtZfL_Cg1Z7oRq3cZSKQgwcAH6MBA1QAKxskuGt1EtVZJQAf3WE4NURzVW2lqpluEETwfvt8-Y1azpluJX1Pzvt4FUWzkWNT-4XBdzcR2PeNJsimuyIgko7j0YUaBzIBtZUMS8jMry-Q3fNUKSqkkwL2NsV491Wu9tl8X7okLxph7XdJaZadFMOdj8iFlBsH9sFsscQa3nolxSe46mCap1PiGrpvguL385D96-y2qRkIe15cRM3WQx76s1iRQrUzQacOe-2ugu-cSx__wQuX9rJBp494hOuYwbeVvg5xMc5z2g9dYdbW5oo-bf969mk9o9wvxh6-Osf3IIVVt7aWe-lZ313144cwe0hXfikn2Yzzgwp4sk55iX-Qiwjz-zbn3v9ByiyVg9nm5ra_eOXv6ZwbMn7d2zrcSQmMogB5-rFneBto3ff8MBBBQ0wImyXwQUn4rm2vvUIkMBd81xiY2ZV92MJMsRU0udVXXyrrl6pXOSUzmeMXXJQ1pR5iyhdrrcW1haMt_ZxXaharJn_-fBQo0dlnczFI_92V_ROa4ORxMSZtMZMqbfMxJQ26lw0W2wSfxowSRZawb9_1V7Y9qZU1kySIxuJ4IzZr3w5hMjSk8g4FgpamUMrFnX7gJZJO7iX38bB4p45t2r73atWnWS3zraenWUhty2fzy9ZJkn2vyRXzkYya_unJZoaSjim1VrMlYhxu-RIi9vvSVlVbZ5IJ0wdJcvs9csy_g8moS7S_ktxgpr2fpoid6hr659lbje5uOcxIwyYuc0wnq4S_gd-JrgZ3ezwfIJpu0XROgcmFt21vM1tYVZcc2Syosr9c8S_XyWith1723WsiRYVXVIzpr9n4l`,
      'Content-Type': 'application/json',
    };
    Logging.log(fcmToken);
    Logging.log('Preparing Notification Body');
    const body = {
      "message":{
          "token": fcmToken,
          "notification":{
            "title": "Aam Digital",
            "body": "This is the aam digital testing, please open the app.",
          }
        }
    };
    // This function added for testing purpose, to test the new notfication entity type
    // this.createAndSaveNotification(fcmToken);
    Logging.log(JSON.stringify(body));
    return this.httpClient.post(fcmGoogleApiUrl, body, { headers });
  }

  private async createAndSaveNotification(fcmToken: string) {
    const notification = new NotificationActivity();
    notification.title = "Dummy Notification Title";
    notification.body = "This is a dummy notification body.";
    notification.actionURL = "http://localhost:4200";
    notification.sentBy = this.currentUser.value?.getId() || "User:demo";
    notification.fcmToken = fcmToken;
    notification.readStatus = false;

    try {
      await this.entityMapper.save<NotificationActivity>(notification);
      Logging.log("Notification saved successfully.");
    } catch (error) {
      Logging.error("Error saving notification: ", error);
    }
  }
}
