import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotificationRuleConditionComponent } from "./notification-rule-condition.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("NotificationRuleConditionComponent", () => {
  let component: NotificationRuleConditionComponent;
  let fixture: ComponentFixture<NotificationRuleConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, NotificationRuleConditionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationRuleConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
