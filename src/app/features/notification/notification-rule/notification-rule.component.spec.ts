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
import type { Mock } from "vitest";

type HttpClientMock = {
  get: Mock;
  post: Mock;
  delete: Mock;
};

type KeycloakAuthServiceMock = {
  login: Mock;
};

describe("NotificationRuleComponent", () => {
  let component: NotificationRuleComponent;
  let fixture: ComponentFixture<NotificationRuleComponent>;
  let mockValue: NotificationRule;
  let mockHttp: HttpClientMock;
  let mockAuthService: KeycloakAuthServiceMock;

  beforeEach(async () => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    mockAuthService = {
      login: vi.fn(),
    };

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

  it("should parse component.value into formControls", () => {
    fixture.componentRef.setInput("value", mockValue);
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      label: "label1",
      entityType: "entityType1",
      changeType: ["created"],
      enabled: true,
      conditions: {},
      notificationType: "entity_change",
    });
  });

  it("should update value model with the correct format when a formControl is updated", () => {
    fixture.componentRef.setInput("value", mockValue);
    fixture.detectChanges();
    const setSpy = vi.spyOn(component.value, "set");

    component.form.setValue({
      label: "label2",
      entityType: "TestEntity",
      changeType: ["created", "updated"],
      notificationType: "entity_change",
      conditions: {},
      enabled: true,
    });

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "label2",
        entityType: "TestEntity",
        changeType: ["created", "updated"],
        notificationType: "entity_change",
        conditions: {},
        enabled: true,
      } as NotificationRule),
    );
  });
});
