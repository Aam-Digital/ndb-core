import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { AccountPageComponent } from "./account-page.component";
import {
  KeycloakAuthService,
  KeycloakUserDto,
} from "../../session/auth/keycloak/keycloak-auth.service";
import { of, throwError } from "rxjs";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { HttpErrorResponse } from "@angular/common/http";
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

    expect(component.email.value).toBe(email);
  }));

  it("should disabled the email form if the disabled flag is set", () => {
    component.disabled = true;

    component.ngOnInit();

    expect(component.email.disabled).toBe(true);
  });

  it("should not save email if form is invalid", () => {
    component.email.setValue("invalid-email");
    expect(component.email).not.toBeValidForm();

    component.setEmail();

    expect(mockAuthService.setEmail).not.toHaveBeenCalled();
  });

  it("should show success message if email was saved successfully", fakeAsync(() => {
    mockAuthService.setEmail.and.returnValue(of({}));
    const validEmail = "valid@email.com";
    component.email.setValue(validEmail);
    expect(component.email).toBeValidForm();

    component.setEmail();

    expect(mockAuthService.setEmail).toHaveBeenCalledWith(validEmail);
    tick();
    expect(mockAlerts.addInfo).toHaveBeenCalled();
  }));

  it("should show error message if email couldn't be set", fakeAsync(() => {
    const errorMessage = "Save email error message";
    mockAuthService.setEmail.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ error: { message: errorMessage } }),
      ),
    );
    component.email.setValue("valid@email.com");

    component.setEmail();
    tick();

    expect(component.email.errors).toEqual({ other: errorMessage });
  }));
});
