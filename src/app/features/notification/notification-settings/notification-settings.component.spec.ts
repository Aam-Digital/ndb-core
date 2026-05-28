import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { By } from "@angular/platform-browser";
import { NotificationSettingsComponent } from "./notification-settings.component";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MockEntityMapperService,
  mockEntityMapperProvider,
} from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import {
  SessionInfo,
  SessionSubject,
} from "../../../core/session/auth/session-info";
import { BehaviorSubject } from "rxjs";
import { TEST_USER } from "../../../core/user/demo-user-generator.service";
import { NotificationService } from "../notification.service";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";
import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";
import {
  NotificationConfig,
  NotificationRule,
} from "../model/notification-config";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { UnsavedChangesService } from "../../../core/entity-details/form/unsaved-changes.service";
import type { Mock } from "vitest";

type NotificationServiceMock = Pick<
  NotificationService,
  | "isNotificationServerEnabled"
  | "isEmailNotificationEnabled"
  | "isPushNotificationSupported"
  | "hasNotificationPermissionGranted"
  | "isDeviceRegistered"
  | "loadNotificationConfig"
  | "registerDevice"
  | "unregisterDevice"
  | "testNotification"
> & {
  isNotificationServerEnabled: Mock;
  isEmailNotificationEnabled: Mock;
  isPushNotificationSupported: Mock;
  hasNotificationPermissionGranted: Mock;
  isDeviceRegistered: Mock;
  loadNotificationConfig: Mock;
  registerDevice: Mock;
  unregisterDevice: Mock;
  testNotification: Mock;
};

type ConfirmationDialogMock = Pick<
  ConfirmationDialogService,
  "getConfirmation"
> & {
  getConfirmation: Mock;
};

describe("NotificationSettingComponent", () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  let entityMapper: MockEntityMapperService;
  const testUser: SessionInfo = { name: TEST_USER, id: TEST_USER, roles: [] };
  let mockNotificationService: NotificationServiceMock;
  let mockConfirmationDialog: ConfirmationDialogMock;

  beforeEach(async () => {
    mockNotificationService = {
      isNotificationServerEnabled: vi.fn(),
      isEmailNotificationEnabled: vi.fn(),
      isPushNotificationSupported: vi.fn(),
      hasNotificationPermissionGranted: vi.fn(),
      isDeviceRegistered: vi.fn(),
      loadNotificationConfig: vi.fn(),
      registerDevice: vi.fn(),
      unregisterDevice: vi.fn(),
      testNotification: vi.fn(),
    };
    mockConfirmationDialog = {
      getConfirmation: vi.fn(),
    };

    mockNotificationService.isNotificationServerEnabled.mockReturnValue(
      Promise.resolve(true),
    );
    mockNotificationService.isEmailNotificationEnabled.mockReturnValue(
      Promise.resolve(true),
    );
    mockNotificationService.isPushNotificationSupported.mockReturnValue(true);
    mockNotificationService.hasNotificationPermissionGranted.mockReturnValue(
      true,
    );
    mockNotificationService.isDeviceRegistered.mockReturnValue(
      Promise.resolve(true),
    );

    const testConfig = new NotificationConfig(TEST_USER);
    testConfig.notificationRules = [];
    mockNotificationService.loadNotificationConfig.mockReturnValue(
      Promise.resolve(testConfig),
    );

    await TestBed.configureTestingModule({
      imports: [
        NotificationSettingsComponent,
        FontAwesomeTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: SessionSubject,
          useValue: new BehaviorSubject(testUser),
        },
        {
          provide: CurrentUserSubject,
          useValue: new BehaviorSubject(undefined),
        },
        { provide: NotificationService, useValue: mockNotificationService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set isFeatureEnabled to false when notification server is disabled", async () => {
    mockNotificationService.isNotificationServerEnabled.mockReturnValue(
      Promise.resolve(false),
    );

    await component.ngOnInit();

    expect(component.isFeatureEnabled()).toBe(false);
  });

  it("should set isBrowserSupported to false when push notifications are not supported", async () => {
    mockNotificationService.isPushNotificationSupported.mockReturnValue(false);

    await component.ngOnInit();

    expect(component.isBrowserSupported()).toBe(false);
  });

  it("should add a new notification rule to the config", async () => {
    await component.ngOnInit();
    const initialLength =
      component.notificationConfig().notificationRules.length;

    component.addNewNotificationRule();

    expect(component.notificationConfig().notificationRules.length).toBe(
      initialLength + 1,
    );
  });

  it("should create a new rule with default values", async () => {
    await component.ngOnInit();

    component.addNewNotificationRule();

    const addedRule =
      component.notificationConfig().notificationRules[
        component.notificationConfig().notificationRules.length - 1
      ];

    expect(addedRule.notificationType).toBe("entity_change");
    expect(addedRule.entityType).toBeUndefined();
    expect(addedRule.enabled).toBe(true);
    expect(addedRule.conditions).toEqual({});
  });

  it("should update the notification rule with new values", async () => {
    await component.ngOnInit();
    component.addNewNotificationRule();
    const testRule = component.notificationConfig().notificationRules[0];
    vi.spyOn(entityMapper, "save").mockReturnValue(Promise.resolve());

    const updatedRule: NotificationRule = {
      ...testRule,
      entityType: "Child",
      label: "Test label",
    };

    component.updateNotificationRule(testRule, updatedRule);

    const updatedInSignal = component.notificationConfig().notificationRules[0];
    expect(updatedInSignal.entityType).toBe("Child");
    expect(updatedInSignal.label).toBe("Test label");
  });

  it("should mark unsaved changes pending after updating a rule", async () => {
    await component.ngOnInit();
    component.addNewNotificationRule();
    const testRule = component.notificationConfig().notificationRules[0];
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    const updatedRule: NotificationRule = {
      ...testRule,
      enabled: false,
    };

    component.updateNotificationRule(testRule, updatedRule);

    expect(unsavedChanges.pending()).toBe(true);
  });

  it("should save the config and clear pending flag when saveSettings is called", async () => {
    await component.ngOnInit();
    component.addNewNotificationRule();
    vi.spyOn(entityMapper, "save").mockReturnValue(Promise.resolve());
    const unsavedChanges = TestBed.inject(UnsavedChangesService);
    unsavedChanges.pending.set(true);

    await component.saveSettings();

    expect(entityMapper.save).toHaveBeenCalledWith(
      component.notificationConfig(),
    );
    expect(unsavedChanges.pending()).toBe(false);
  });

  it("should remove rule when user confirms deletion", async () => {
    await component.ngOnInit();
    component.addNewNotificationRule();
    component.addNewNotificationRule();
    vi.spyOn(entityMapper, "save").mockReturnValue(Promise.resolve());
    mockConfirmationDialog.getConfirmation.mockReturnValue(
      Promise.resolve(true),
    );
    const initialLength =
      component.notificationConfig().notificationRules.length;

    const result = await component.confirmRemoveNotificationRule(0);

    expect(result).toBe(true);
    expect(component.notificationConfig().notificationRules.length).toBe(
      initialLength - 1,
    );
  });

  it("should save config after removing rule", async () => {
    await component.ngOnInit();
    component.addNewNotificationRule();
    vi.spyOn(entityMapper, "save").mockReturnValue(Promise.resolve());
    mockConfirmationDialog.getConfirmation.mockReturnValue(
      Promise.resolve(true),
    );

    await component.confirmRemoveNotificationRule(0);

    expect(entityMapper.save).toHaveBeenCalled();
  });

  it("should call notification service to send test notification", () => {
    mockNotificationService.testNotification.mockReturnValue(
      Promise.resolve({}),
    );

    component.testNotification();

    expect(mockNotificationService.testNotification).toHaveBeenCalled();
  });

  it("should set isEmailFeatureEnabled to false when backend email feature is disabled", async () => {
    mockNotificationService.isEmailNotificationEnabled.mockReturnValue(
      Promise.resolve(false),
    );

    await component.ngOnInit();
    fixture.detectChanges();

    const channelToggles = fixture.debugElement.queryAll(
      By.directive(MatSlideToggle),
    );
    const emailToggle = channelToggles[2].componentInstance as MatSlideToggle;

    expect(component.isEmailFeatureEnabled()).toBe(false);
    expect(emailToggle.disabled).toBe(true);
  });

  it("should enable email channel in config and mark changes pending when toggled on", async () => {
    await component.ngOnInit();
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    component.toggleEmailChannel({ checked: true } as MatSlideToggleChange);

    expect(component.notificationConfig().channels?.["email"]).toBe(true);
    expect(unsavedChanges.pending()).toBe(true);
  });

  it("should disable email channel in config and mark changes pending when toggled off", async () => {
    await component.ngOnInit();
    component.toggleEmailChannel({ checked: true } as MatSlideToggleChange);

    component.toggleEmailChannel({ checked: false } as MatSlideToggleChange);

    expect(component.notificationConfig().channels?.["email"]).toBe(false);
  });
});
