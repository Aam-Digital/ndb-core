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
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { BehaviorSubject, of } from "rxjs";
import { CoreTestingModule } from "#src/app/utils/core-testing.module";
import type { SessionInfo } from "../../session/auth/session-info";
import type { Mock } from "vitest";

type UserAdminServiceMock = {
  getAllRoles: Mock;
  createUser: Mock;
  updateUser: Mock;
  deleteUser: Mock;
};

type AlertServiceMock = {
  addInfo: Mock;
  addAlert: Mock;
  addDanger: Mock;
};

type KeycloakAuthServiceMock = {
  changePassword: Mock;
};

type HttpClientMock = {
  post: Mock;
};

type DialogRefMock = {
  close: Mock;
};

type ConfirmationDialogMock = {
  getConfirmation: Mock;
};

describe("UserDetailsComponent", () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;
  let mockUserAdminService: UserAdminServiceMock;
  let mockAlertService: AlertServiceMock;
  let mockKeycloakService: KeycloakAuthServiceMock;
  let mockHttpClient: HttpClientMock;
  let mockSessionSubject: BehaviorSubject<SessionInfo | null>;
  let mockCurrentUserSubject: BehaviorSubject<UserAccount | null>;
  let mockDialogRef: DialogRefMock;
  let mockConfirmationDialog: ConfirmationDialogMock;

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
    mockUserAdminService = {
      getAllRoles: vi.fn().mockName("UserAdminService.getAllRoles"),
      createUser: vi.fn().mockName("UserAdminService.createUser"),
      updateUser: vi.fn().mockName("UserAdminService.updateUser"),
      deleteUser: vi.fn().mockReturnValue(of({ userDeleted: true })),
    };
    mockUserAdminService.getAllRoles.mockReturnValue(of([mockRole]));
    mockUserAdminService.updateUser.mockReturnValue(of({ userUpdated: true }));

    mockAlertService = {
      addInfo: vi.fn().mockName("AlertService.addInfo"),
      addAlert: vi.fn().mockName("AlertService.addAlert"),
      addDanger: vi.fn().mockName("AlertService.addDanger"),
    };
    mockKeycloakService = {
      changePassword: vi.fn().mockName("KeycloakAuthService.changePassword"),
    };
    mockHttpClient = {
      post: vi.fn().mockName("HttpClient.post"),
    };
    mockHttpClient.post.mockReturnValue(of({}));

    mockSessionSubject = new BehaviorSubject<SessionInfo | null>({
      id: "session-user-id",
      name: "test-user",
      email: "test@example.com",
      roles: ["user_app"],
    });

    mockCurrentUserSubject = new BehaviorSubject<UserAccount | null>(null);

    mockDialogRef = {
      close: vi.fn().mockName("MatDialogRef.close"),
    };

    mockConfirmationDialog = {
      getConfirmation: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent, CoreTestingModule],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: KeycloakAuthService, useValue: mockKeycloakService },
        { provide: SessionSubject, useValue: mockSessionSubject },
        { provide: CurrentUserSubject, useValue: mockCurrentUserSubject },
        { provide: ConfirmationDialogService, useValue: mockConfirmationDialog },
      ],
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should populate form when userAccount input is set", async () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();

    // Wait for availableRoles resource to load
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.form.get("email")?.value).toBe(mockUserAccount.email);
    expect(component.form.get("roles")?.value).toEqual(mockUserAccount.roles);
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

  it("should close dialog with accountUpdated result when form is valid", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("isInDialog", false);
      fixture.componentRef.setInput("userAccount", mockUserAccount);
      fixture.detectChanges();

      component.editMode();
      fixture.detectChanges();

      component.form.patchValue({
        email: "updated@example.com",
        roles: [mockRole],
      });

      component.save();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "accountUpdated",
          data: expect.anything(),
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not close dialog when form is invalid", () => {
    fixture.componentRef.setInput("isInDialog", false);
    fixture.detectChanges();

    component.editMode();
    fixture.detectChanges();

    component.form.patchValue({ email: "" });
    component.save();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it("should close dialog with formCancel result when cancel is called", () => {
    component.cancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith({ type: "formCancel" });
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

    const newRole: Role = {
      id: "new-role",
      name: "admin",
      description: "Admin role",
    };
    mockUserAdminService.getAllRoles.mockReturnValue(of([mockRole, newRole]));

    component.form.patchValue({
      roles: [mockRole, newRole],
    });

    component.save();

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      expect.stringContaining("/admin/clear_local/"),
      undefined,
    );
  });

  it("should call deleteUser and clear userAccount when confirmed", async () => {
    fixture.componentRef.setInput("userAccount", {
      ...mockUserAccount,
      userEntityId: "User:some-entity-id",
    });
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();

    await component.deleteAccount();

    expect(mockUserAdminService.deleteUser).toHaveBeenCalledWith(
      "User:some-entity-id",
    );
    expect(component.userAccount()).toBeNull();
  });

  it("should not delete own account and show self-deletion warning", async () => {
    fixture.componentRef.setInput("userAccount", {
      ...mockUserAccount,
      userEntityId: "User:some-entity-id",
    });
    mockSessionSubject.next({ id: mockUserAccount.id, name: "test", roles: [] });
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();

    await component.deleteAccount();

    expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
  });

  it("should not deactivate own account and show self-deletion warning", async () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    mockSessionSubject.next({ id: mockUserAccount.id, name: "test", roles: [] });
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();

    await component.enableAccount(false);

    expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
  });

  it("should not trigger sync reset when only email is updated", () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();

    component.editMode();
    fixture.detectChanges();

    component.form.patchValue({
      email: "newemail@example.com",
      roles: [mockRole], // Same roles
    });

    component.save();

    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });
});
