import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AssistantButtonComponent } from "./assistant-button.component";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "app/core/session/session-type";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { NAVIGATOR_TOKEN } from "app/utils/di-tokens";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { SetupService } from "../setup.service";
import { AssistantService } from "../assistant.service";

describe("AssistantButtonComponent", () => {
  let component: AssistantButtonComponent;
  let fixture: ComponentFixture<AssistantButtonComponent>;
  let mockAssistantService: jasmine.SpyObj<AssistantService>;

  beforeEach(async () => {
    mockAssistantService = jasmine.createSpyObj("AssistantService", [
      "openAssistant",
    ]);

    await TestBed.configureTestingModule({
      imports: [AssistantButtonComponent],
      providers: [
        CurrentUserSubject,
        LoginStateSubject,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: KeycloakAuthService, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        {
          provide: SetupService,
          useValue: { waitForConfigReady: () => Promise.resolve(true) },
        },
        { provide: AssistantService, useValue: mockAssistantService },
        SyncStateSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call AssistantService.openAssistant when openAssistant is called", async () => {
    mockAssistantService.openAssistant.and.returnValue(Promise.resolve());

    await component.openAssistant();

    expect(mockAssistantService.openAssistant).toHaveBeenCalled();
  });
});
