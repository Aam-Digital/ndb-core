import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";

import { PasswordFormComponent } from "./password-form.component";
import { MockedTestingModule } from "../../../../../utils/mocked-testing.module";
import { SessionService } from "../../../session-service/session.service";
import { CouchdbAuthService } from "../couchdb-auth.service";
import { AuthService } from "../../auth.service";
import { NEVER } from "rxjs";

describe("PasswordFormComponent", () => {
  let component: PasswordFormComponent;
  let fixture: ComponentFixture<PasswordFormComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockCouchDBAuth: jasmine.SpyObj<CouchdbAuthService>;

  beforeEach(async () => {
    mockSessionService = jasmine.createSpyObj(["login", "checkPassword"], {
      syncState: NEVER,
      loginState: NEVER,
    });
    mockCouchDBAuth = jasmine.createSpyObj(["changePassword"]);

    await TestBed.configureTestingModule({
      imports: [PasswordFormComponent, MockedTestingModule.withState()],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: AuthService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordFormComponent);
    component = fixture.componentInstance;
    component.couchdbAuthService = mockCouchDBAuth;
    component.username = "testUser";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should disable the form when disabled is passed to component", () => {
    component.disabled = true;
    component.ngOnInit();
    expect(component.passwordForm.disabled).toBeTrue();
  });

  it("should set error when password is incorrect", () => {
    component.passwordForm.get("currentPassword").setValue("wrongPW");
    mockSessionService.checkPassword.and.returnValue(false);

    expect(component.passwordForm.get("currentPassword")).toBeValidForm();

    component.changePassword();

    expect(component.passwordForm.get("currentPassword")).not.toBeValidForm();
  });

  it("should set error when password change fails", fakeAsync(() => {
    component.passwordForm.get("currentPassword").setValue("testPW");
    component.passwordForm.get("newPassword").setValue("Password1-");
    component.passwordForm.get("confirmPassword").setValue("Password1-");
    mockSessionService.checkPassword.and.returnValue(true);
    mockCouchDBAuth.changePassword.and.rejectWith(new Error("pw change error"));

    expectAsync(component.changePassword()).toBeRejected();
    tick();

    expect(mockCouchDBAuth.changePassword).toHaveBeenCalled();
    flush();
  }));

  it("should set success and re-login when password change worked", fakeAsync(() => {
    component.passwordForm.get("currentPassword").setValue("testPW");
    component.passwordForm.get("newPassword").setValue("Password1-");
    component.passwordForm.get("confirmPassword").setValue("Password1-");
    mockSessionService.checkPassword.and.returnValue(true);
    mockCouchDBAuth.changePassword.and.resolveTo();
    mockSessionService.login.and.resolveTo(null);

    component.changePassword();
    tick();
    expect(mockSessionService.login).toHaveBeenCalledWith(
      "testUser",
      "Password1-",
    );
    flush();
  }));
});
