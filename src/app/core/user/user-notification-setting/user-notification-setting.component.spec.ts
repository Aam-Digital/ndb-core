import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Database } from "app/core/database/database";
import { UserNotificationSettingComponent } from "./user-notification-setting.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

describe("UserNotificationSettingComponent", () => {
  let component: UserNotificationSettingComponent;
  let fixture: ComponentFixture<UserNotificationSettingComponent>;

  beforeEach(async () => {
    let mockDatabase: jasmine.SpyObj<Database>;
    await TestBed.configureTestingModule({
      imports: [UserNotificationSettingComponent, FontAwesomeModule],
      providers: [{ provide: Database, useValue: mockDatabase }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserNotificationSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
