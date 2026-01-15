import { ComponentFixture, TestBed } from "@angular/core/testing";
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
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { NotificationService } from "../notification.service";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";
import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";
import {
  NotificationConfig,
  NotificationRule,
} from "../model/notification-config";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";

describe("NotificationSettingComponent", () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  let entityMapper: MockEntityMapperService;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  const testUser: SessionInfo = { name: TEST_USER, id: TEST_USER, roles: [] };
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(async () => {
    mockHttp = jasmine.createSpyObj(["get", "post"]);
    mockAuthService = jasmine.createSpyObj(["login", "logout"]);
    mockNotificationService = jasmine.createSpyObj([
      "isNotificationServerEnabled",
      "isPushNotificationSupported",
      "hasNotificationPermissionGranted",
      "isDeviceRegistered",
      "loadNotificationConfig",
      "registerDevice",
      "unregisterDevice",
      "testNotification",
    ]);
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);

    mockNotificationService.isNotificationServerEnabled.and.returnValue(
      Promise.resolve(true),
    );
    mockNotificationService.isPushNotificationSupported.and.returnValue(true);
    mockNotificationService.hasNotificationPermissionGranted.and.returnValue(
      true,
    );
    mockNotificationService.isDeviceRegistered.and.returnValue(
      Promise.resolve(true),
    );

    const testConfig = new NotificationConfig(TEST_USER);
    testConfig.notificationRules = [];
    testConfig.channels = {};
    mockNotificationService.loadNotificationConfig.and.returnValue(
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
        { provide: HttpClient, useValue: mockHttp },
        { provide: KeycloakAuthService, useValue: mockAuthService },
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
    mockNotificationService.isNotificationServerEnabled.and.returnValue(
      Promise.resolve(false),
    );

    await component.ngOnInit();

    expect(component.isFeatureEnabled()).toBe(false);
  });

  it("should set isBrowserSupported to false when push notifications are not supported", async () => {
    mockNotificationService.isPushNotificationSupported.and.returnValue(false);

    await component.ngOnInit();

    expect(component.isBrowserSupported()).toBe(false);
  });

  it("should add a new notification rule to the config", async () => {
    await component.ngOnInit();
    const initialLength =
      component.notificationConfig().notificationRules.length;

    await component.addNewNotificationRule();

    expect(component.notificationConfig().notificationRules.length).toBe(
      initialLength + 1,
    );
  });

  it("should create a new rule with default values", async () => {
    await component.ngOnInit();

    await component.addNewNotificationRule();

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
    await component.addNewNotificationRule();
    const testRule = component.notificationConfig().notificationRules[0];
    spyOn(entityMapper, "save").and.returnValue(Promise.resolve());

    const updatedRule: NotificationRule = {
      ...testRule,
      entityType: "Child",
      label: "Test label",
    };

    await component.updateNotificationRule(testRule, updatedRule);

    expect(testRule.entityType).toBe("Child");
    expect(testRule.label).toBe("Test label");
  });

  it("should save the config after updating a rule", async () => {
    await component.ngOnInit();
    await component.addNewNotificationRule();
    const testRule = component.notificationConfig().notificationRules[0];
    spyOn(entityMapper, "save").and.returnValue(Promise.resolve());

    const updatedRule: NotificationRule = {
      ...testRule,
      enabled: false,
    };

    await component.updateNotificationRule(testRule, updatedRule);

    expect(entityMapper.save).toHaveBeenCalledWith(
      component.notificationConfig(),
    );
  });

  it("should remove rule when user confirms deletion", async () => {
    await component.ngOnInit();
    await component.addNewNotificationRule();
    await component.addNewNotificationRule();
    spyOn(entityMapper, "save").and.returnValue(Promise.resolve());
    mockConfirmationDialog.getConfirmation.and.returnValue(
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
    await component.addNewNotificationRule();
    spyOn(entityMapper, "save").and.returnValue(Promise.resolve());
    mockConfirmationDialog.getConfirmation.and.returnValue(
      Promise.resolve(true),
    );

    await component.confirmRemoveNotificationRule(0);

    expect(entityMapper.save).toHaveBeenCalled();
  });

  it("should call notification service to send test notification", () => {
    mockNotificationService.testNotification.and.returnValue(
      Promise.resolve({}),
    );

    component.testNotification();

    expect(mockNotificationService.testNotification).toHaveBeenCalled();
  });
});
