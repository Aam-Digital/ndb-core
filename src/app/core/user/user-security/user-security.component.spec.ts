import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";

import { UserSecurityComponent } from "./user-security.component";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { BehaviorSubject, of, throwError } from "rxjs";
import { SessionSubject } from "../../session/auth/session-info";
import { environment } from "../../../../environments/environment";
import { Entity } from "../../entity/model/entity";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UserAdminService } from "../user-admin-service/user-admin.service";

describe("UserSecurityComponent", () => {
  let component: UserSecurityComponent;
  let fixture: ComponentFixture<UserSecurityComponent>;

  let mockUserAdminService: jasmine.SpyObj<UserAdminService>;
  let mockHttp: jasmine.SpyObj<HttpClient>;

  const USER_ID = "test-id";
  const assignedRole: Role = {
    id: "assigned-role",
    name: "Assigned Role",
    description: "this role is assigned to the user",
  };
  const notAssignedRole: Role = {
    id: "not-assigned-role",
    name: "Not Assigned Role",
    description: "this role is not assigned to the user",
  };
  const user = Object.assign(new Entity(), { username: "test-user" });
  let keycloakUser: UserAccount;

  beforeEach(async () => {
    keycloakUser = {
      id: USER_ID,
      email: "my@email.de",
      roles: [assignedRole],
      enabled: true,
    };

    mockUserAdminService = jasmine.createSpyObj([
      "getUser",
      "getAllRoles",
      "updateUser",
      "createUser",
      "deleteUser",
    ]);
    mockUserAdminService.getUser.and.returnValue(of(keycloakUser));
    mockUserAdminService.updateUser.and.returnValue(of({ userUpdated: true }));
    mockUserAdminService.deleteUser.and.returnValue(of({ userDeleted: true }));
    mockUserAdminService.createUser.and.returnValue(of(keycloakUser));
    mockUserAdminService.getAllRoles.and.returnValue(
      of([assignedRole, notAssignedRole]),
    );

    mockHttp = jasmine.createSpyObj(["post"]);
    mockHttp.post.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [UserSecurityComponent],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: HttpClient, useValue: mockHttp },
        {
          provide: SessionSubject,
          useValue: new BehaviorSubject({
            name: user.getId(true),
            roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
          }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSecurityComponent);
    component = fixture.componentInstance;
    component.entity = user;
    fixture.detectChanges();
    component.user = undefined;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load existing account data", fakeAsync(() => {
    initComponent();

    expect(component.user).toBe(keycloakUser);
    expect(component.form).toHaveValue({
      userEntityId: user.getId(),
      email: "my@email.de",
      roles: [assignedRole],
    });
  }));

  it("should not run into errors if no existing user account", fakeAsync(() => {
    initComponent(of(null));

    expect(component.user).toBe(null);
    expect(component.form.getRawValue()).toEqual({
      userEntityId: user.getId(),
      email: undefined,
      roles: [],
    });
  }));

  it("should only send modified values to keycloak when updating", fakeAsync(() => {
    initComponent();

    const emailForm = component.form.get("email");
    emailForm.setValue("other@email.com");
    emailForm.markAsDirty();
    component.updateAccount();
    tick();

    expect(mockUserAdminService.updateUser).toHaveBeenCalledWith(USER_ID, {
      email: "other@email.com",
    });
    flush();
  }));

  it("should create a user with all form values", fakeAsync(() => {
    initComponent(throwError(() => new HttpErrorResponse({})));

    expect(component.user).toBeUndefined();
    component.form.patchValue({
      roles: [assignedRole],
      email: "new@email.com",
    });
    component.createAccount();
    tick();

    expect(mockUserAdminService.createUser).toHaveBeenCalledWith(
      user.getId(),
      "new@email.com",
      [assignedRole],
    );
    flush();
  }));

  it("should assign error message when http call fails", fakeAsync(() => {
    mockUserAdminService.createUser.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({ error: { message: "user unauthorized" } }),
      ),
    );
    component.form.patchValue({
      username: "test-name",
      email: "my@email.com",
      roles: [{ id: "test_role", name: "test role", description: "x" }],
    });
    component.createAccount();
    tick();

    expect(component.form.errors).toEqual({ failed: "user unauthorized" });
  }));

  it("should disable the form if a user has been deactivated", fakeAsync(() => {
    initComponent();
    component.editForm();
    expect(component.form.enabled).toBeTrue();
    expect(component.user.enabled).toBeTrue();

    component.toggleAccount(false);
    tick();

    expect(component.form.disabled).toBeTrue();
    expect(component.user.enabled).toBeFalse();
    flush();
  }));

  it("should reset the sync state if roles changed for a user", fakeAsync(() => {
    initComponent();

    component.form.get("roles").setValue([assignedRole, notAssignedRole]);
    component.form.get("roles").markAsDirty();
    component.updateAccount();
    tick();

    expect(mockHttp.post).toHaveBeenCalledWith(
      // see https://github.com/Aam-Digital/replication-backend/blob/master/src/admin/admin.controller.ts
      `${environment.DB_PROXY_PREFIX}/admin/clear_local/${Entity.DATABASE}`,
      undefined,
    );
    flush();
  }));

  it("should not reset sync state if roles did not change", fakeAsync(() => {
    initComponent();

    component.form.get("email").setValue("another@mail.com");
    component.form.get("email").markAsDirty();
    component.updateAccount();
    tick();

    expect(mockHttp.post).not.toHaveBeenCalled();
    flush();
  }));

  it("Automatically trims whitespaces on the email input", fakeAsync(() => {
    initComponent();

    component.form.get("email").setValue("some_copied_email@mail.com  ");
    tick();

    expect(component.form.errors).toBeNull();
    expect(component.form.get("email")).toHaveValue(
      "some_copied_email@mail.com",
    );
  }));

  function initComponent(keycloakResult = of(keycloakUser)) {
    mockUserAdminService.getUser.and.returnValue(keycloakResult);
    component.ngOnInit();
    tick();
  }
});
