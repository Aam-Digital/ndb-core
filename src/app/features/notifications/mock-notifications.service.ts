// TODO: Need to remove this file once the notification UI testing is completed.

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class MockNotificationsService {
  mockNotifications = [
    {
      _id: "Notification:1d3f8f2d-f7ae-45cb-a712-b45f9025badd",
      _rev: "1-4d6e4511f7e4dd8679e19f0cc2d9c22e",
      title: "Dummy Notification Title",
      body: "This is a dummy notification body.",
      actionURL: "http://localhost:4200",
      sentBy: "User:demo",
      fcmToken:
        "f6dmHHeKUM1Q_DfSCLmtl9:APA91bEgFmu2yUcMTzOr8CusfjWHTUPPvsVivuOX5pGAInhmPsLrEdAWsuPFBHjwNaLnrQWAjBXohvn1Mkb_fYHwIpIi3aBiOy9HudBWzytXDwwlbLwd66o",
      readStatus: true,
      created: {
        at: "2024-12-03T19:21:19.130Z",
      },
      updated: {
        at: "2024-12-03T19:21:19.130Z",
      },
    },
    {
      _id: "Notification:26d173f0-bb37-4357-ae6c-86e8f606c6ea",
      _rev: "1-51345a2e4934d98597e7479424b0b09e",
      title: "Dummy Notification Title",
      body: "This is a dummy notification body.",
      actionURL: "http://localhost:4200",
      fcmToken:
        "f6dmHHeKUM1Q_DfSCLmtl9:APA91bEgFmu2yUcMTzOr8CusfjWHTUPPvsVivuOX5pGAInhmPsLrEdAWsuPFBHjwNaLnrQWAjBXohvn1Mkb_fYHwIpIi3aBiOy9HudBWzytXDwwlbLwd66o",
      readStatus: false,
      sentBy: "User:demo",
      created: {
        at: "2024-12-03T19:07:47.538Z",
      },
      updated: {
        at: "2024-12-03T19:07:47.538Z",
      },
    },
  ];

  constructor() {}

  getNotifications() {
    return this.mockNotifications;
  }
}
