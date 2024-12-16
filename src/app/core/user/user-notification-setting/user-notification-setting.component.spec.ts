import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserNotificationSettingComponent } from "./user-notification-setting.component";

describe("UserNotificationSettingComponent", () => {
  let component: UserNotificationSettingComponent;
  let fixture: ComponentFixture<UserNotificationSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserNotificationSettingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserNotificationSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
