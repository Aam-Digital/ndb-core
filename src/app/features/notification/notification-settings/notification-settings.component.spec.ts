import {
  Component,
  model,
  output,
  signal,
  WritableSignal,
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { By } from "@angular/platform-browser";
import { NotificationSettingsComponent } from "./notification-settings.component";
import { NotificationRuleComponent } from "../notification-rule/notification-rule.component";
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
import { ConfirmationDialogMock } from "#src/app/utils/test-utils/dialog-mocks";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { Config } from "#src/app/core/config/config";
import { PLACEHOLDERS } from "#src/app/core/entity/schema/entity-schema-field";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

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
  isNotificationServerEnabled: WritableSignal<boolean>;
  isEmailNotificationEnabled: WritableSignal<boolean>;
  isPushNotificationSupported: WritableSignal<boolean>;
  hasNotificationPermissionGranted: WritableSignal<boolean>;
  isDeviceRegistered: Mock;
  loadNotificationConfig: Mock;
  registerDevice: Mock;
  unregisterDevice: Mock;
  testNotification: Mock;
};

@Component({ selector: "app-notification-rule", template: "" })
class NotificationRuleStubComponent {
  value = model<NotificationRule>();
  removeNotificationRule = output<void>();
}

describe("NotificationSettingComponent", () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  let entityMapper: MockEntityMapperService;
  const testUser: SessionInfo = { name: TEST_USER, id: TEST_USER, roles: [] };
  let mockNotificationService: NotificationServiceMock;
  let mockConfirmationDialog: ConfirmationDialogMock;

  const initializeComponent = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();
  };

  beforeEach(async () => {
    mockNotificationService = {
      isNotificationServerEnabled: signal(true),
      isEmailNotificationEnabled: signal(true),
      isPushNotificationSupported: signal(true),
      hasNotificationPermissionGranted: signal(true),
      isDeviceRegistered: vi.fn(),
      loadNotificationConfig: vi.fn(),
      registerDevice: vi.fn(),
      unregisterDevice: vi.fn(),
      testNotification: vi.fn(),
    };
    mockConfirmationDialog = {
      getConfirmation: vi.fn(),
    };

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
        { provide: AlertService, useValue: { addInfo: vi.fn() } },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    })
      .overrideComponent(NotificationSettingsComponent, {
        remove: { imports: [NotificationRuleComponent] },
        add: { imports: [NotificationRuleStubComponent] },
      })
      .compileComponents();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
  });

  it("should add a new notification rule to the config", async () => {
    await initializeComponent();
    const initialLength =
      component.notificationConfig().notificationRules.length;

    component.addNewNotificationRule();

    expect(component.notificationConfig().notificationRules.length).toBe(
      initialLength + 1,
    );
  });

  it("should create a new rule with default values", async () => {
    await initializeComponent();

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
    await initializeComponent();
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
    await initializeComponent();
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
    await initializeComponent();
    component.addNewNotificationRule();
    vi.spyOn(entityMapper, "save").mockReturnValue(Promise.resolve());
    const unsavedChanges = TestBed.inject(UnsavedChangesService);
    expect(unsavedChanges.pending()).toBe(true);

    await component.saveSettings();

    expect(entityMapper.save).toHaveBeenCalledWith(
      component.notificationConfig(),
    );
    expect(unsavedChanges.pending()).toBe(false);
  });

  it("should remove rule when user confirms deletion", async () => {
    await initializeComponent();
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
    await initializeComponent();
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

  it("should disable UI toggle when backend email feature is disabled", async () => {
    mockNotificationService.isEmailNotificationEnabled.set(false);

    await initializeComponent();

    const channelToggles = fixture.debugElement.queryAll(
      By.directive(MatSlideToggle),
    );
    const emailToggle = channelToggles[2].componentInstance as MatSlideToggle;

    expect(emailToggle.disabled).toBe(true);
  });

  it("should enable email channel in config and mark changes pending when toggled on", async () => {
    await initializeComponent();
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    component.toggleEmailChannel({ checked: true } as MatSlideToggleChange);

    expect(component.notificationConfig().channels?.["email"]).toBe(true);
    expect(unsavedChanges.pending()).toBe(true);
  });

  it("should disable email channel in config and mark changes pending when toggled off", async () => {
    await initializeComponent();
    const unsavedChanges = TestBed.inject(UnsavedChangesService);
    component.toggleEmailChannel({ checked: true } as MatSlideToggleChange);

    component.toggleEmailChannel({ checked: false } as MatSlideToggleChange);

    expect(component.notificationConfig().channels?.["email"]).toBe(false);
    expect(unsavedChanges.pending()).toBe(true);
  });

  describe("initial config for a new user", () => {
    const todoRule = (label: string, assignee: string): NotificationRule => ({
      label,
      notificationType: "entity_change",
      entityType: "Todo",
      changeType: ["created"],
      conditions: { assignedTo: { $elemMatch: assignee } },
      enabled: true,
    });

    beforeEach(() => {
      mockNotificationService.loadNotificationConfig.mockRejectedValue({
        status: 404,
      });
    });

    it.each([
      {
        name: "the default rules for the linked profile",
        profileId: "demo",
        template: undefined,
        expected: [
          {
            entityType: "Todo",
            conditions: { assignedTo: { $elemMatch: "TestEntity:demo" } },
            enabled: true,
          },
          {
            entityType: "Note",
            conditions: { authors: { $elemMatch: "TestEntity:demo" } },
          },
        ],
      },
      {
        name: "no default rules without a linked profile",
        profileId: null,
        template: undefined,
        expected: [],
      },
      {
        name: "template rules with the current user filled in everywhere",
        profileId: "demo",
        template: [
          todoRule("first", PLACEHOLDERS.CURRENT_USER),
          todoRule("second", PLACEHOLDERS.CURRENT_USER),
        ],
        expected: [
          {
            label: "first",
            conditions: { assignedTo: { $elemMatch: "TestEntity:demo" } },
          },
          {
            label: "second",
            conditions: { assignedTo: { $elemMatch: "TestEntity:demo" } },
          },
        ],
      },
      {
        name: "only the template rules not about the current user without a linked profile",
        profileId: null,
        template: [
          todoRule("mine", PLACEHOLDERS.CURRENT_USER),
          todoRule("someone else", "TestEntity:other"),
        ],
        expected: [{ label: "someone else" }],
      },
    ])("should create $name", async ({ profileId, template, expected }) => {
      TestBed.inject(CurrentUserSubject).next(
        profileId ? new TestEntity(profileId) : null,
      );
      if (template) {
        entityMapper.add(
          new Config(NotificationConfig.TEMPLATE_ENTITY_ID, {
            notificationRules: template,
          }),
        );
      }

      await initializeComponent();

      expect(component.notificationConfig().notificationRules).toEqual(
        expected.map((rule) => expect.objectContaining(rule)),
      );
    });
  });
});
