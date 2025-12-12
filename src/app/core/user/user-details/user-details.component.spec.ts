import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UserDetailsComponent } from "./user-details.component";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { AlertService } from "../../alerts/alert.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SessionSubject } from "../../session/auth/session-info";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { BehaviorSubject, of } from "rxjs";
import { CoreTestingModule } from "#src/app/utils/core-testing.module";

describe("UserDetailsComponent", () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;
  let mockUserAdminService: jasmine.SpyObj<UserAdminService>;
  let mockAlertService: jasmine.SpyObj<AlertService>;
  let mockKeycloakService: jasmine.SpyObj<KeycloakAuthService>;
  let mockSessionSubject: BehaviorSubject<any>;
  let mockCurrentUserSubject: BehaviorSubject<any>;

  const mockRole: Role = {
    id: "test-role",
    name: "user_app",
    description: "Basic user role",
  };

  const mockUserAccount: UserAccount = {
    id: "test-user-id",
    email: "test@example.com",
    roles: [mockRole],
    enabled: true,
    emailVerified: true,
  };

  beforeEach(async () => {
    mockUserAdminService = jasmine.createSpyObj("UserAdminService", [
      "getAllRoles",
      "createUser",
      "updateUser",
    ]);
    mockUserAdminService.getAllRoles.and.returnValue(of([mockRole]));
    mockUserAdminService.updateUser.and.returnValue(of({ userUpdated: true }));

    mockAlertService = jasmine.createSpyObj("AlertService", [
      "addInfo",
      "addAlert",
      "addDanger",
    ]);
    mockKeycloakService = jasmine.createSpyObj("KeycloakAuthService", [
      "changePassword",
    ]);

    mockSessionSubject = new BehaviorSubject({
      name: "test-user",
      email: "test@example.com",
      roles: ["user_app"],
    });

    mockCurrentUserSubject = new BehaviorSubject(null);

    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent, CoreTestingModule],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj(["close"]) },
        { provide: KeycloakAuthService, useValue: mockKeycloakService },
        { provide: SessionSubject, useValue: mockSessionSubject },
        { provide: CurrentUserSubject, useValue: mockCurrentUserSubject },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should populate form when userAccount input is set", () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();

    expect(component.form.get("email")?.value).toBe(mockUserAccount.email);
    expect(component.form.get("roles")?.value).toEqual(mockUserAccount.roles);
  });

  it("should disable form in view mode", () => {
    fixture.componentRef.setInput("editing", false);
    fixture.detectChanges();

    expect(component.disabled()).toBe(true);
  });

  it("should enable form in edit mode", () => {
    fixture.componentRef.setInput("editing", true);
    fixture.detectChanges();

    expect(component.disabled()).toBe(false);
  });

  it("should trim whitespace from email", () => {
    fixture.detectChanges();

    component.form.get("email")?.setValue("  test@example.com  ");
    fixture.detectChanges();

    expect(component.form.get("email")?.value).toBe("test@example.com");
  });

  it("should validate required email", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.componentRef.setInput("editing", true);
    fixture.detectChanges();

    component.form.get("email")?.setValue("");
    expect(component.form.get("email")?.hasError("required")).toBe(true);
  });

  it("should validate email format", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.componentRef.setInput("editing", true);
    fixture.detectChanges();

    component.form.get("email")?.setValue("invalid-email");
    expect(component.form.get("email")?.hasError("email")).toBe(true);

    component.form.get("email")?.setValue("valid@email.com");
    expect(component.form.get("email")?.hasError("email")).toBe(false);
  });

  it("should emit formSubmit when form is valid", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.componentRef.setInput("editing", true);
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();

    // Set the available roles manually since it's auto-populated from service
    component.availableRoles.set([mockRole]);

    const submitSpy = jasmine.createSpy("action");
    component.action.subscribe(submitSpy);

    component.form.patchValue({
      email: "updated@example.com",
      roles: [mockRole],
    });

    component.onSubmit();

    expect(submitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: "accountUpdated",
        data: jasmine.anything(),
      }),
    );
  });

  it("should not emit formSubmit when form is invalid", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.componentRef.setInput("editing", true);
    fixture.detectChanges();

    const submitSpy = jasmine.createSpy("action");
    component.action.subscribe(submitSpy);

    component.form.patchValue({ email: "" });
    component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("should emit formCancel action when cancel is called", () => {
    const cancelSpy = jasmine.createSpy("action");
    component.action.subscribe(cancelSpy);

    component.onCancel();

    expect(cancelSpy).toHaveBeenCalledWith({ type: "formCancel" });
  });

  it("should set and clear global errors", () => {
    component.form.setErrors({ failed: "Test error message" });
    expect(component.getGlobalError()).toBe("Test error message");

    component.form.setErrors(null);
    expect(component.getGlobalError()).toBeNull();
  });
});
