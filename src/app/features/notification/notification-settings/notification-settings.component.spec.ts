import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationSettingsComponent } from "./notification-settings.component";
import {
  EntityRegistry,
  entityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MockEntityMapperService } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
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

describe("NotificationSettingComponent", () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  let entityMapper: MockEntityMapperService;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  const testUser: SessionInfo = { name: TEST_USER, id: TEST_USER, roles: [] };
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationSettingsComponent,
        FontAwesomeTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: EntityMapperService, useValue: entityMapper },
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
