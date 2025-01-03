import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationSettingComponent } from "./notification-setting.component";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("NotificationSettingComponent", () => {
  let component: NotificationSettingComponent;
  let fixture: ComponentFixture<NotificationSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationSettingComponent,
        FontAwesomeTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
