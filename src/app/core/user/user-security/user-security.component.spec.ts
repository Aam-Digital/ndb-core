import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";

import { UserSecurityComponent } from "./user-security.component";
import { UserModule } from "../user.module";
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

describe("UserSecurityComponent", () => {
  let component: UserSecurityComponent;
  let fixture: ComponentFixture<UserSecurityComponent>;
  let mockHttp: jasmine.SpyObj<HttpClient>;
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
  const keycloakUser: KeycloakUser = {
    id: "userId",
    email: "my@email.de",
    roles: [assignedRole],
    enabled: true,
    username: "test-user",
  };

  beforeEach(async () => {
    mockHttp = jasmine.createSpyObj(["get", "put", "post"]);
    mockHttp.get.and.returnValue(of([assignedRole, notAssignedRole]));
    mockHttp.put.and.returnValue(of({}));
    mockHttp.post.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [UserModule, MockedTestingModule],
      providers: [
        { provide: AuthService, useClass: KeycloakAuthService },
        { provide: HttpClient, useValue: mockHttp },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load existing account data", fakeAsync(() => {
    mockHttp.get.and.returnValue(of(keycloakUser));

    component.onInitFromDynamicConfig({ entity: user });
    tick();

    expect(component.userId).toBe("userId");
    expect(component.form).toHaveValue({
      username: user.name,
      email: "my@email.de",
      roles: [assignedRole],
    });
  }));

  it("should only send modified values to keycloak when updating", fakeAsync(() => {
    mockHttp.get.and.returnValue(of(keycloakUser));
    component.onInitFromDynamicConfig({ entity: user });
    tick();

    const emailForm = component.form.get("email");
    emailForm.setValue("other@email.com");
    emailForm.markAsDirty();
    component.updateAccount();
    tick();

    expect(mockHttp.put).toHaveBeenCalledWith(
      jasmine.stringMatching(/\/account\/userId$/),
      { email: "other@email.com" }
    );
    flush();
  }));

  it("should create a user with all form values", fakeAsync(() => {
    mockHttp.get.and.returnValue(throwError(() => new HttpErrorResponse({})));
    component.onInitFromDynamicConfig({ entity: user });
    tick();

    expect(component.userId).toBeUndefined();
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
      }
    );
    flush();
  }));

  it("should assign error message when http call fails", fakeAsync(() => {
    mockHttp.post.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ error: { message: "user unauthorized" } })
      )
    );

    component.form.patchValue({ username: "test-name", email: "my@email.com" });
    component.createAccount();
    tick();

    expect(component.form.errors).toEqual({ failed: "user unauthorized" });
  }));

  it("should disable the form if a user has been deactivated", fakeAsync(() => {
    mockHttp.get.and.returnValue(of(keycloakUser));
    component.onInitFromDynamicConfig({ entity: user });
    tick();
    expect(component.form.enabled).toBeTrue();
    expect(component.userEnabled).toBeTrue();

    component.toggleAccount(false);
    tick();

    expect(component.form.disabled).toBeTrue();
    expect(component.userEnabled).toBeFalse();
  }));
});
