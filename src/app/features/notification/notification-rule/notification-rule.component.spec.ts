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

describe("NotificationRuleComponent", () => {
  let component: NotificationRuleComponent;
  let fixture: ComponentFixture<NotificationRuleComponent>;
  let mockValue: NotificationRule;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationRuleComponent);
    component = fixture.componentInstance;

    mockValue = {
      label: "label1",
      entityType: "entityType1",
      changeType: ["created"],
      enabled: true,
      conditions: {},
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
      label: "label1",
      entityType: "entityType1",
      changeType: ["created"],
      enabled: true,
      conditions: {},
      notificationType: "entity_change",
    });
  });

  it("should emit valueChange with the correct format when a formControl is updated", () => {
    spyOn(component.valueChange, "emit");
    component.initForm();

    component.form.setValue({
      label: "label2",
      entityType: "EventNote",
      changeType: ["created", "updated"],
      notificationType: "entity_change",
      conditions: {},
      enabled: true,
    });

    expect(component.valueChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        label: "label2",
        entityType: "EventNote",
        changeType: ["created", "updated"],
        notificationType: "entity_change",
        conditions: {},
        enabled: true,
      } as NotificationRule),
    );
  });
});
