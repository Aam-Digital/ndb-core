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
import { ConfigService } from "app/core/config/config.service";
import type { Mock } from "vitest";

type AssistantServiceMock = Pick<AssistantService, "openAssistant"> & {
  openAssistant: Mock;
};

describe("AssistantButtonComponent", () => {
  let component: AssistantButtonComponent;
  let fixture: ComponentFixture<AssistantButtonComponent>;
  let mockAssistantService: AssistantServiceMock;
  let mockConfigService: { isSystemUninitialized: Mock };

  beforeEach(async () => {
    mockAssistantService = {
      openAssistant: vi.fn().mockName("AssistantService.openAssistant"),
    };
    mockConfigService = {
      isSystemUninitialized: vi.fn().mockReturnValue(false),
    };

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
        { provide: ConfigService, useValue: mockConfigService },
        SyncStateSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should call AssistantService.openAssistant when openAssistant is called", async () => {
    mockAssistantService.openAssistant.mockReturnValue(Promise.resolve());

    await component.openAssistant();

    expect(mockAssistantService.openAssistant).toHaveBeenCalled();
  });

  it.each([
    { uninitialized: true, opensSetup: true },
    { uninitialized: false, opensSetup: false },
  ])(
    "offers the setup on startup only for a system without a config (uninitialized: $uninitialized)",
    async ({ uninitialized, opensSetup }) => {
      // a config that could not be loaded also has no config available, but must
      // not offer to set up the existing system again
      mockConfigService.isSystemUninitialized.mockReturnValue(uninitialized);
      mockAssistantService.openAssistant.mockResolvedValue(undefined);

      const newFixture = TestBed.createComponent(AssistantButtonComponent);
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(mockAssistantService.openAssistant).toHaveBeenCalledTimes(
        opensSetup ? 1 : 0,
      );
    },
  );
});
