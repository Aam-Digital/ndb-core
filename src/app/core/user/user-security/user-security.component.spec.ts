import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";

import { UserSecurityComponent } from "./user-security.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { AuthService } from "../../session/auth/auth.service";
import {
  KeycloakAuthService,
  KeycloakUser,
  Role,
} from "../../session/auth/keycloak/keycloak-auth.service";
import { of, throwError } from "rxjs";
import { User } from "../user";
import { AppSettings } from "../../app-config/app-settings";
import { SessionService } from "../../session/session-service/session.service";

describe("UserSecurityComponent", () => {
  let component: UserSecurityComponent;
  let fixture: ComponentFixture<UserSecurityComponent>;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  let mockSession: jasmine.SpyObj<SessionService>;
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
  const user = { name: "test-user" } as User;
  let keycloakUser: KeycloakUser;

  beforeEach(async () => {
    keycloakUser = {
      id: "userId",
      email: "my@email.de",
      roles: [assignedRole],
      enabled: true,
      username: "test-user",
    };
    mockHttp = jasmine.createSpyObj(["get", "put", "post"]);
    mockHttp.get.and.returnValue(of([assignedRole, notAssignedRole]));
    mockHttp.put.and.returnValue(of({}));
    mockHttp.post.and.returnValue(of({}));
    mockSession = jasmine.createSpyObj(["getCurrentUser"]);
    mockSession.getCurrentUser.and.returnValue({
      name: user.name,
      roles: [KeycloakAuthService.ACCOUNT_MANAGER_ROLE],
    });

    await TestBed.configureTestingModule({
      imports: [UserSecurityComponent, MockedTestingModule],
      providers: [
        { provide: AuthService, useClass: KeycloakAuthService },
        { provide: HttpClient, useValue: mockHttp },
        { provide: SessionService, useValue: mockSession },
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
      username: user.name,
      email: "my@email.de",
      roles: [assignedRole],
    });
  }));

  it("should only send modified values to keycloak when updating", fakeAsync(() => {
    initComponent();

    const emailForm = component.form.get("email");
    emailForm.setValue("other@email.com");
    emailForm.markAsDirty();
    component.updateAccount();
    tick();

    expect(mockHttp.put).toHaveBeenCalledWith(
      jasmine.stringMatching(/\/account\/userId$/),
      { email: "other@email.com" },
    );
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

    expect(mockHttp.post).toHaveBeenCalledWith(
      jasmine.stringMatching(/\/account$/),
      {
        username: user.name,
        email: "new@email.com",
        roles: [assignedRole],
        enabled: true,
      },
    );
    flush();
  }));

  it("should assign error message when http call fails", fakeAsync(() => {
    mockHttp.post.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({ error: { message: "user unauthorized" } }),
      ),
    );

    component.form.patchValue({ username: "test-name", email: "my@email.com" });
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
      `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}/clear_local`,
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
    mockHttp.get.and.returnValue(keycloakResult);
    component.ngOnInit();
    tick();
  }
});
