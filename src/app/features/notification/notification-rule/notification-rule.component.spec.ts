import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationRuleComponent } from "./notification-rule.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { NotificationRule } from "../model/notification-config";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("NotificationRuleComponent", () => {
  let component: NotificationRuleComponent;
  let fixture: ComponentFixture<NotificationRuleComponent>;
  let mockValue: NotificationRule;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationRuleComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationRuleComponent);
    component = fixture.componentInstance;

    mockValue = {
      entityType: "entityType1",
      enabled: true,
      channels: { push: true },
      conditions: "some condition",
      notificationType: "entity_change",
    };
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should parse component.value into formControls on ngOnChanges", () => {
    component.value = mockValue;
    component.ngOnChanges({ value: { currentValue: mockValue } } as any);

    expect(component.value).toEqual(mockValue);
  });

  it("should emit valueChange with the correct format when a formControl is updated", () => {
    spyOn(component.valueChange, "emit");
    component.initForm();
    component.form.setValue({
      entityType: "EventNote",
      notificationType: "entity_change",
      channels: {
        "0": true,
      },
      conditions: "",
      enabled: true,
    });

    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ entityType: "EventNote", enabled: true }),
    );
  });
});
