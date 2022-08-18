import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PasswordFormComponent } from "./password-form.component";
import { UserModule } from "../user.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SessionService } from "../../session/session-service/session.service";
import { CouchdbAuthService } from "../../session/auth/couchdb-auth.service";

describe("PasswordFormComponent", () => {
  let component: PasswordFormComponent;
  let fixture: ComponentFixture<PasswordFormComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockCouchDBAuth: jasmine.SpyObj<CouchdbAuthService>;

  beforeEach(async () => {
    mockSessionService = jasmine.createSpyObj(["login", "checkPassword"]);
    mockCouchDBAuth = jasmine.createSpyObj(["changePassword"]);

    await TestBed.configureTestingModule({
      imports: [UserModule, MockedTestingModule.withState()],
      providers: [{ provide: SessionService, useValue: mockSessionService }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PasswordFormComponent);
    component = fixture.componentInstance;
    component.couchdbAuthService = mockCouchDBAuth;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set error when password is incorrect", () => {
    component.passwordForm.get("currentPassword").setValue("wrongPW");
    mockSessionService.checkPassword.and.returnValue(false);

    expect(component.passwordForm.get("currentPassword")).toBeValidForm();

    component.changePassword();

    expect(component.passwordForm.get("currentPassword")).not.toBeValidForm();
  });

  it("should set error when password change fails", fakeAsync(() => {
    component.username = "testUser";
    component.passwordForm.get("currentPassword").setValue("testPW");
    mockSessionService.checkPassword.and.returnValue(true);
    mockCouchDBAuth.changePassword.and.rejectWith(
      new Error("pw change error")
    );


    expectAsync(component.changePassword()).toBeRejected();
    tick();

    expect(mockCouchDBAuth.changePassword).toHaveBeenCalled();
    expect(component.passwordChangeResult.success).toBeFalse();
    expect(component.passwordChangeResult.error).toBe("pw change error");
  }));

  it("should set success and re-login when password change worked", fakeAsync(() => {
    component.username = "testUser";
    component.passwordForm.get("currentPassword").setValue("testPW");
    component.passwordForm.get("newPassword").setValue("changedPassword");
    mockSessionService.checkPassword.and.returnValue(true);
    mockCouchDBAuth.changePassword.and.resolveTo();
    mockSessionService.login.and.resolveTo(null);

    component.changePassword();
    tick();
    expect(component.passwordChangeResult.success).toBeTrue();
    expect(mockSessionService.login).toHaveBeenCalledWith(
      "testUser",
      "changedPassword"
    );
  }));
});
