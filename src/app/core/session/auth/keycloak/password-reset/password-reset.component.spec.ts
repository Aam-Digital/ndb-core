import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { PasswordResetComponent } from "./password-reset.component";
import { KeycloakAuthService } from "../keycloak-auth.service";
import { SessionModule } from "../../../session.module";
import { MockedTestingModule } from "../../../../../utils/mocked-testing.module";
import { of, throwError } from "rxjs";
import { MatLegacySnackBar as MatSnackBar } from "@angular/material/legacy-snack-bar";
import { HttpErrorResponse } from "@angular/common/http";

describe("PasswordResetComponent", () => {
  let component: PasswordResetComponent;
  let fixture: ComponentFixture<PasswordResetComponent>;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj(["forgotPassword"]);
    await TestBed.configureTestingModule({
      imports: [SessionModule, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordResetComponent);
    component = fixture.componentInstance;
    component.keycloakAuth = mockAuthService;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle the email input when clicking the button", () => {
    component.toggleEmailForm();
    expect(component.passwordResetActive).toBeTrue();
    component.toggleEmailForm();
    expect(component.passwordResetActive).toBeFalse();
  });

  it("should not call service when email is not valid", () => {
    component.email.setValue("invalid-email");
    expect(component.email).not.toBeValidForm();

    component.sendEmail();

    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
  });

  it("should close form and show snackbar if password reset mail was sent successfully", fakeAsync(() => {
    mockAuthService.forgotPassword.and.returnValue(of({}));
    const snackbarSpy = spyOn(TestBed.inject(MatSnackBar), "open");
    component.toggleEmailForm();
    expect(component.passwordResetActive).toBeTrue();
    const validEmail = "valid@email.com";
    component.email.setValue(validEmail);
    expect(component.email).toBeValidForm();

    component.sendEmail();

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(validEmail);
    tick();
    expect(snackbarSpy).toHaveBeenCalled();
    expect(component.passwordResetActive).toBeFalse();
  }));

  it("should show error message if email couldn't be found", fakeAsync(() => {
    const errorMessage = "Email not found error";
    mockAuthService.forgotPassword.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ error: { message: errorMessage } })
      )
    );
    component.email.setValue("valid@email.com");

    component.sendEmail();
    tick();

    expect(component.email.errors).toEqual({ notFound: errorMessage });
  }));
});
