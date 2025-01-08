import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotificationConditionComponent } from "./notification-condition.component";

describe("NotificationConditionComponent", () => {
  let component: NotificationConditionComponent;
  let fixture: ComponentFixture<NotificationConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationConditionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
