import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotificationRuleConditionComponent } from "./notification-rule-condition.component";

describe("NotificationRuleConditionComponent", () => {
  let component: NotificationRuleConditionComponent;
  let fixture: ComponentFixture<NotificationRuleConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationRuleConditionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationRuleConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
