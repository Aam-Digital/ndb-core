import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { AccountPageComponent } from "./account-page.component";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { KeycloakUserDto } from "../user-admin-service/keycloak-user-dto";
import { AlertService } from "../../alerts/alert.service";

describe("AccountPageComponent", () => {
  let component: AccountPageComponent;
  let fixture: ComponentFixture<AccountPageComponent>;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;
  let mockAlerts: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj([
      "changePassword",
      "getUserinfo",
      "setEmail",
      "login",
    ]);
    mockAuthService.getUserinfo.and.rejectWith();
    mockAuthService.login.and.rejectWith();
    mockAlerts = jasmine.createSpyObj(["addInfo"]);
    await TestBed.configureTestingModule({
      imports: [AccountPageComponent, MockedTestingModule.withState()],
      providers: [
        { provide: KeycloakAuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlerts },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the email if its already set", fakeAsync(() => {
    const email = "mail@exmaple.com";
    mockAuthService.getUserinfo.and.resolveTo({ email } as KeycloakUserDto);

    component.ngOnInit();
    tick();

    expect(component.user?.email).toBe(email);
  }));
});
