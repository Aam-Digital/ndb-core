import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationConditionComponent } from "./notification-condition.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import {
  NotificationCondition,
  NotificationRule,
} from "../model/notification-config";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("NotificationConditionComponent", () => {
  let component: NotificationConditionComponent;
  let fixture: ComponentFixture<NotificationConditionComponent>;
  let mockNotificationConditionValue: NotificationCondition;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationConditionComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationConditionComponent);
    component = fixture.componentInstance;

    mockNotificationConditionValue = {
      entityTypeField: "entityTypeField",
      operator: "$eq",
      condition: "",
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should parse component.notificationRule conditions into formControls on ngOnChanges", () => {
    component.notificationRule = {
      conditions: [mockNotificationConditionValue],
    } as NotificationRule;
    component.ngOnChanges({
      value: { currentValue: mockNotificationConditionValue },
    } as any);

    expect(component.notificationRule.conditions).toEqual([
      mockNotificationConditionValue,
    ]);
  });

  it("should emit notificationCondition valueChange with the correct format when a formControl is updated", () => {
    spyOn(component.notificationConditionValueChange, "emit");
    component.notificationRule = {
      conditions: [mockNotificationConditionValue],
    } as NotificationRule;
    component.notificationConditionIndex = 0;

    component.initNotificationConditionForm();
    const mockUpdatedNotificationCondition: NotificationCondition = {
      entityTypeField: "Subject",
      operator: "$gte",
      condition: "english",
    };

    component.notificationConditionForm.setValue(
      mockUpdatedNotificationCondition,
    );

    expect(
      component.notificationConditionValueChange.emit,
    ).toHaveBeenCalledWith(
      jasmine.objectContaining({
        conditions: [mockUpdatedNotificationCondition],
      }),
    );
  });
});
