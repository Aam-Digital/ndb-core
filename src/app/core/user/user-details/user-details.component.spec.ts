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
import { BehaviorSubject, of, Subject, throwError } from "rxjs";
import { CoreTestingModule } from "#src/app/utils/core-testing.module";
import { Angulartics2Module } from "angulartics2";
import type { SessionInfo } from "../../session/auth/session-info";
import type { Mock } from "vitest";
import {
  ConfirmationDialogMock,
  mockConfirmationDialog,
} from "#src/app/utils/test-utils/dialog-mocks";

type UserAdminServiceMock = {
  getAllRoles: Mock;
  createUser: Mock;
  updateUser: Mock;
  deleteUser: Mock;
  resendInvitation: Mock;
  getUser: Mock;
};

type AlertServiceMock = {
  addInfo: Mock;
  addAlert: Mock;
  addDanger: Mock;
  addWarning: Mock;
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
  let confirmationDialog: ConfirmationDialogMock;

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
      resendInvitation: vi
        .fn()
        .mockName("UserAdminService.resendInvitation")
        .mockReturnValue(of(undefined)),
      getUser: vi.fn().mockName("UserAdminService.getUser"),
    };
    mockUserAdminService.getAllRoles.mockReturnValue(of([mockRole]));
    mockUserAdminService.updateUser.mockReturnValue(of({ userUpdated: true }));
    mockUserAdminService.getUser.mockReturnValue(of(null));

    mockAlertService = {
      addInfo: vi.fn().mockName("AlertService.addInfo"),
      addAlert: vi.fn().mockName("AlertService.addAlert"),
      addDanger: vi.fn().mockName("AlertService.addDanger"),
      addWarning: vi.fn().mockName("AlertService.addWarning"),
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

    confirmationDialog = mockConfirmationDialog();

    await TestBed.configureTestingModule({
      imports: [
        UserDetailsComponent,
        CoreTestingModule,
        Angulartics2Module.forRoot(),
      ],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: KeycloakAuthService, useValue: mockKeycloakService },
        { provide: SessionSubject, useValue: mockSessionSubject },
        { provide: CurrentUserSubject, useValue: mockCurrentUserSubject },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialog,
        },
      ],
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
    mockSessionSubject.next({
      id: mockUserAccount.id,
      name: "test",
      roles: [],
    });
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();

    await component.deleteAccount();

    expect(mockUserAdminService.deleteUser).not.toHaveBeenCalled();
  });

  it("should not deactivate own account and show self-deletion warning", async () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    mockSessionSubject.next({
      id: mockUserAccount.id,
      name: "test",
      roles: [],
    });
    fixture.detectChanges();
    component.editMode();
    fixture.detectChanges();

    await component.enableAccount(false);

    expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
  });

  it("should offer resend invitation only for existing accounts with unverified email", () => {
    fixture.componentRef.setInput("userAccount", {
      ...mockUserAccount,
      emailVerified: false,
    });
    fixture.detectChanges();
    expect(component.invitationPending()).toBe(true);

    // email verified -> invitation completed
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.detectChanges();
    expect(component.invitationPending()).toBe(false);

    // own profile mode -> admin actions hidden
    fixture.componentRef.setInput("userAccount", {
      ...mockUserAccount,
      emailVerified: false,
    });
    fixture.componentRef.setInput("isProfileMode", true);
    fixture.detectChanges();
    expect(component.invitationPending()).toBe(false);

    // creating a new account -> nothing to resend yet
    fixture.componentRef.setInput("isProfileMode", false);
    fixture.componentRef.setInput("userAccount", null);
    fixture.detectChanges();
    expect(component.invitationPending()).toBe(false);
  });

  it("should resend invitation via service and alert about success or failure", async () => {
    fixture.componentRef.setInput("userAccount", {
      ...mockUserAccount,
      emailVerified: false,
    });
    fixture.detectChanges();

    await component.resendInvitation();

    expect(mockUserAdminService.resendInvitation).toHaveBeenCalledWith(
      mockUserAccount.id,
    );
    expect(mockAlertService.addInfo).toHaveBeenCalled();

    mockUserAdminService.resendInvitation.mockReturnValue(
      throwError(() => new Error("sending failed")),
    );
    await component.resendInvitation();

    expect(mockAlertService.addDanger).toHaveBeenCalled();
  });

  it("should ignore further resend clicks while a resend request is pending", async () => {
    fixture.componentRef.setInput("userAccount", {
      ...mockUserAccount,
      emailVerified: false,
    });
    fixture.detectChanges();

    const pendingRequest = new Subject<void>();
    mockUserAdminService.resendInvitation.mockReturnValue(pendingRequest);

    const firstClick = component.resendInvitation();
    expect(component.resendingInvitation()).toBe(true);

    component.resendInvitation();
    expect(mockUserAdminService.resendInvitation).toHaveBeenCalledTimes(1);

    pendingRequest.next();
    pendingRequest.complete();
    await firstClick;

    expect(component.resendingInvitation()).toBe(false);
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

  describe("changing the linked profile", () => {
    const linkedUserAccount: UserAccount = {
      ...mockUserAccount,
      userEntityId: "legacy-id", // no type prefix, as stored by a pre-existing account
    };

    it("should keep the profile field editable for an existing account", () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();

      component.editMode();
      fixture.detectChanges();

      expect(component.form.get("userEntityId").disabled).toBe(false);
    });

    it("should not allow clearing the linked profile of an already-linked account", () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      component.form.get("userEntityId").setValue(null);

      expect(component.form.get("userEntityId").hasError("required")).toBe(
        true,
      );
      expect(component.form.invalid).toBe(true);
    });

    it("should allow editing other fields of an account that has no linked profile", async () => {
      fixture.componentRef.setInput("userAccount", {
        ...mockUserAccount,
        userEntityId: undefined,
      });
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      expect(component.form.get("userEntityId").hasError("required")).toBe(
        false,
      );

      component.form.patchValue({ email: "updated@example.com" });
      await component.save();

      expect(mockUserAdminService.updateUser).toHaveBeenCalledWith(
        mockUserAccount.id,
        { email: "updated@example.com" },
      );
    });

    it("should not update when re-saving an unchanged profile without a type prefix", async () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      // form now displays the normalised "User:legacy-id", but nothing was actually changed
      await component.save();

      expect(mockUserAdminService.getUser).not.toHaveBeenCalled();
      expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ type: "formCancel" });
    });

    it("should refuse re-linking to a profile that already has a different account", async () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      mockUserAdminService.getUser.mockReturnValue(
        of({ id: "some-other-account-id", enabled: true }),
      );
      component.form.patchValue({ userEntityId: "User:other-entity" });

      await component.save();

      expect(mockUserAdminService.getUser).toHaveBeenCalledWith(
        "User:other-entity",
      );
      expect(mockAlertService.addDanger).toHaveBeenCalledWith(
        expect.stringContaining("Each profile can only be linked"),
      );
      expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it("should not re-link when the check for an existing account fails", async () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      mockUserAdminService.getUser.mockReturnValue(
        throwError(() => new Error("server unreachable")),
      );
      component.form.patchValue({ userEntityId: "User:other-entity" });

      await component.save();

      expect(mockAlertService.addDanger).toHaveBeenCalledWith(
        expect.stringContaining("Could not check"),
      );
      expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it("should proceed when the profile lookup resolves back to this very account", async () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      mockUserAdminService.getUser.mockReturnValue(
        of({ id: linkedUserAccount.id, enabled: true }),
      );
      component.form.patchValue({ userEntityId: "User:other-entity" });

      await component.save();

      expect(mockUserAdminService.updateUser).toHaveBeenCalledWith(
        linkedUserAccount.id,
        expect.objectContaining({ userEntityId: "User:other-entity" }),
      );
      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({ type: "accountUpdated" }),
      );
    });

    it("should not re-link when the user cancels the confirmation", async () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      mockUserAdminService.getUser.mockReturnValue(of(null));
      confirmationDialog.getConfirmation.mockResolvedValue(false);
      component.form.patchValue({ userEntityId: "User:other-entity" });

      await component.save();

      expect(mockUserAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it("should trigger sync reset when the linked profile changes, not only on role changes", async () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      mockUserAdminService.getUser.mockReturnValue(of(null));
      component.form.patchValue({ userEntityId: "User:other-entity" });

      await component.save();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/admin/clear_local/"),
        undefined,
      );
    });

    it("should surface a re-login notice when re-linking one's own account", async () => {
      fixture.componentRef.setInput("userAccount", linkedUserAccount);
      mockSessionSubject.next({
        id: linkedUserAccount.id,
        name: "test",
        roles: [],
      });
      fixture.detectChanges();
      component.editMode();
      fixture.detectChanges();

      mockUserAdminService.getUser.mockReturnValue(of(null));
      component.form.patchValue({ userEntityId: "User:other-entity" });

      await component.save();

      expect(mockUserAdminService.updateUser).toHaveBeenCalled();
      expect(mockAlertService.addWarning).toHaveBeenCalledWith(
        expect.stringContaining("log out"),
      );
    });
  });
});
