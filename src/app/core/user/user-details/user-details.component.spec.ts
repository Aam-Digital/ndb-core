import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UserDetailsComponent } from "./user-details.component";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { AlertService } from "../../alerts/alert.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { HttpClient } from "@angular/common/http";
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
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
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
    mockHttpClient = jasmine.createSpyObj("HttpClient", ["post"]);
    mockHttpClient.post.and.returnValue(of({}));

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
        { provide: HttpClient, useValue: mockHttpClient },
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

  it("should initialize form as disabled", () => {
    fixture.detectChanges();

    expect(component.form.disabled).toBe(true);
    expect(component.formDisabled()).toBe(true);
  });

  it("should enable form when onEdit is called", () => {
    fixture.detectChanges();

    component.editMode();
    fixture.detectChanges();

    expect(component.form.disabled).toBe(false);
    expect(component.formDisabled()).toBe(false);
  });

  it("should disable form when onCancel is called", () => {
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();
    expect(component.form.disabled).toBe(false);
    expect(component.formDisabled()).toBe(false);

    component.cancel();
    fixture.detectChanges();

    expect(component.form.disabled).toBe(true);
    expect(component.formDisabled()).toBe(true);
  });

  it("should trim whitespace from email", () => {
    fixture.detectChanges();

    component.form.get("email")?.setValue("  test@example.com  ");
    fixture.detectChanges();

    expect(component.form.get("email")?.value).toBe("test@example.com");
  });

  it("should validate required email", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();

    component.form.get("email")?.setValue("");
    expect(component.form.get("email")?.hasError("required")).toBe(true);
  });

  it("should validate email format", () => {
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();

    component.form.get("email")?.setValue("invalid-email");
    expect(component.form.get("email")?.hasError("email")).toBe(true);

    component.form.get("email")?.setValue("valid@email.com");
    expect(component.form.get("email")?.hasError("email")).toBe(false);
  });

  it("should emit formSubmit when form is valid", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();

    // Set the available roles manually since it's auto-populated from service
    component.availableRoles.set([mockRole]);

    component.editMode();
    fixture.detectChanges();

    const submitSpy = jasmine.createSpy("action");
    component.action.subscribe(submitSpy);

    component.form.patchValue({
      email: "updated@example.com",
      roles: [mockRole],
    });

    component.save();

    expect(submitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: "accountUpdated",
        data: jasmine.anything(),
      }),
    );
  });

  it("should not emit formSubmit when form is invalid", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.detectChanges();

    component.editMode();
    fixture.detectChanges();

    const submitSpy = jasmine.createSpy("action");
    component.action.subscribe(submitSpy);

    component.form.patchValue({ email: "" });
    component.save();

    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("should emit formCancel action when cancel is called", () => {
    const cancelSpy = jasmine.createSpy("action");
    component.action.subscribe(cancelSpy);

    component.cancel();

    expect(cancelSpy).toHaveBeenCalledWith({ type: "formCancel" });
  });

  it("should set and clear global errors", () => {
    component.form.setErrors({ failed: "Test error message" });
    expect(component.getGlobalError()).toBe("Test error message");

    component.form.setErrors(null);
    expect(component.getGlobalError()).toBeNull();
  });

  it("should trigger sync reset when roles are updated", () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();

    component.editMode();
    fixture.detectChanges();

    component.availableRoles.set([mockRole]);

    const newRole: Role = {
      id: "new-role",
      name: "admin",
      description: "Admin role",
    };
    component.availableRoles.set([mockRole, newRole]);

    component.form.patchValue({
      roles: [mockRole, newRole],
    });

    component.save();

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      jasmine.stringContaining("/admin/clear_local/"),
      undefined,
    );
  });

  it("should not trigger sync reset when only email is updated", () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();

    component.editMode();
    fixture.detectChanges();

    component.availableRoles.set([mockRole]);

    component.form.patchValue({
      email: "newemail@example.com",
      roles: [mockRole], // Same roles
    });

    component.save();

    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });
});
