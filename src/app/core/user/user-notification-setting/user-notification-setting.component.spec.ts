import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UserNotificationSettingComponent } from "./user-notification-setting.component";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("UserNotificationSettingComponent", () => {
  let component: UserNotificationSettingComponent;
  let fixture: ComponentFixture<UserNotificationSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserNotificationSettingComponent, FontAwesomeTestingModule],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserNotificationSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
