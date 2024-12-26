import { Injectable } from "@angular/core";
import moment from "moment";
import { v4 as uuid } from "uuid";

// TODO: Need to remove this file once the notification UI testing is completed.

@Injectable({
  providedIn: "root",
})
export class MockNotificationsService {
  mockNotifications = [
    createDummyNotification(true, moment().subtract(1, "hour").toDate()),
    createDummyNotification(true, moment().subtract(1, "day").toDate()),
    createDummyNotification(true, moment().subtract(1, "week").toDate()),
    createDummyNotification(true, moment().subtract(1, "month").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
    createDummyNotification(true, moment().subtract(1, "year").toDate()),
  ];

  getNotifications() {
    return this.mockNotifications;
  }
}

function createDummyNotification(
  read: boolean = true,
  date: Date = new Date(),
  title: string = "Dummy Notification Title",
) {
  return {
    _id: "Notification:" + uuid(),
    _rev: "1-4d6e4511f7e4dd8679e19f0cc2d9c22e",
    title: title,
    body: "This is a dummy notification body.",
    actionURL: "http://localhost:4200",
    notificationFor: "demo",
    fcmToken: "",
    readStatus: read,
    created: {
      at: date.toISOString(),
    },
    updated: {
      at: date.toISOString(),
    },
  };
}
