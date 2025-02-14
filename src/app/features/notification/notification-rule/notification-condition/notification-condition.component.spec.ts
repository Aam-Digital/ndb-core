import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationConditionComponent } from "./notification-condition.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("NotificationConditionComponent", () => {
  let component: NotificationConditionComponent;
  let fixture: ComponentFixture<NotificationConditionComponent>;

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

    component.form = new FormGroup({
      entityTypeField: new FormControl(""),
      operator: new FormControl(""),
      condition: new FormControl(""),
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should update the form value when form controls are changed", () => {
    component.form.get("operator")?.setValue("$gte");
    expect(component.form.get("operator")?.value).toBe("$gte");
  });

  it("should emit removeNotificationCondition event when removeNotificationCondition is triggered", () => {
    spyOn(component.removeNotificationCondition, "emit");
    component.removeNotificationCondition.emit();
    expect(component.removeNotificationCondition.emit).toHaveBeenCalled();
  });
});
