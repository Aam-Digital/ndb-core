import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationRuleComponent } from "./notification-rule.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import { NotificationRule } from "../model/notification-config";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { NotificationService } from "../notification.service";

describe("NotificationRuleComponent", () => {
  let component: NotificationRuleComponent;
  let fixture: ComponentFixture<NotificationRuleComponent>;
  let mockValue: NotificationRule;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationRuleComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: HttpClient, useValue: mockHttp },
        { provide: KeycloakAuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationRuleComponent);
    component = fixture.componentInstance;

    mockValue = {
      entityType: "entityType1",
      enabled: true,
      channels: { push: true },
      conditions: "",
      notificationType: "entity_change",
    };
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should parse component.value into formControls on ngOnChanges", () => {
    component.value = mockValue;
    component.ngOnChanges({ value: { currentValue: mockValue } } as any);

    expect(component.form.getRawValue()).toEqual({
      entityType: "entityType1",
      enabled: true,
      channels: ["push"], // expect channels value to be parsed into an array
      conditions: "",
      notificationType: "entity_change",
    });
  });

  it("should emit valueChange with the correct format when a formControl is updated", () => {
    spyOn(component.valueChange, "emit");
    component.initForm();

    component.form.setValue({
      entityType: "EventNote",
      notificationType: "entity_change",
      channels: ["push"], // output from MatSelect
      conditions: "",
      enabled: true,
    });

    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        entityType: "EventNote",
        notificationType: "entity_change",
        channels: { push: true }, // expect channels value to be parsed into an object
        conditions: "",
        enabled: true,
      } as NotificationRule),
    );
  });
});
