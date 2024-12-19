import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationItemComponent } from "./notification-item.component";
import { NotificationEvent } from "../model/notification-event";

describe("NotificationItemComponent", () => {
  let component: NotificationItemComponent;
  let fixture: ComponentFixture<NotificationItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationItemComponent);
    component = fixture.componentInstance;
    component.notification = new NotificationEvent();

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
