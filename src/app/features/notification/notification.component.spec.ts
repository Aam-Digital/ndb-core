import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { MatMenuTrigger } from "@angular/material/menu";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { NotificationComponent } from "./notification.component";
import { NotificationEvent } from "./model/notification-event";

describe("NotificationComponent", () => {
  let component: NotificationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationComponent, MockedTestingModule.withState()],
    }).compileComponents();

    component = TestBed.createComponent(
      NotificationComponent,
    ).componentInstance;
  });

  it("closes the notification list after opening a clicked notification", async () => {
    const navigate = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);
    const notificationList = { closeMenu: vi.fn() };
    const notification = new NotificationEvent();
    notification.actionURL = "/child/1";

    await component.notificationClicked(
      notification,
      notificationList as unknown as MatMenuTrigger,
    );

    expect(navigate).toHaveBeenCalledWith(["/child/1"]);
    expect(notificationList.closeMenu).toHaveBeenCalled();
    expect(notification.readStatus).toBe(true);
  });
});
