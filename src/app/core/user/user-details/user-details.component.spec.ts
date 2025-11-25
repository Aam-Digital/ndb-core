import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UserDetailsComponent } from "./user-details.component";
import { Role, UserAccount } from "../user-admin-service/user-account";

describe("UserDetailsComponent", () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;

  const mockRole: Role = {
    id: "test-role",
    name: "user_app",
    description: "Basic user role",
  };

  const mockUserAccount: UserAccount = {
    id: "test-user-id",
    userEntityId: "User:test",
    email: "test@example.com",
    roles: [mockRole],
    enabled: true,
    emailVerified: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize form with empty values", () => {
    expect(component.form).toBeDefined();
    expect(component.form.get("email")?.value).toBe("");
    expect(component.form.get("roles")?.value).toEqual([]);
  });

  it("should populate form when userAccount input is set", () => {
    fixture.componentRef.setInput("userAccount", mockUserAccount);
    fixture.componentRef.setInput("availableRoles", [mockRole]);
    fixture.detectChanges();

    expect(component.form.get("email")?.value).toBe(mockUserAccount.email);
    expect(component.form.get("userEntityId")?.value).toBe(
      mockUserAccount.userEntityId,
    );
  });

  it("should disable form in view mode", () => {
    fixture.componentRef.setInput("mode", "view");
    fixture.detectChanges();

    expect(component.form.disabled).toBe(true);
  });

  it("should enable form in edit mode", () => {
    fixture.componentRef.setInput("mode", "edit");
    fixture.detectChanges();

    expect(component.form.get("email")?.disabled).toBe(false);
    expect(component.form.get("roles")?.disabled).toBe(false);
  });

  it("should trim whitespace from email", () => {
    fixture.componentRef.setInput("mode", "edit");
    fixture.detectChanges();

    component.form.get("email")?.setValue("  test@example.com  ");
    fixture.detectChanges();

    expect(component.form.get("email")?.value).toBe("test@example.com");
  });

  it("should validate required email", () => {
    fixture.componentRef.setInput("mode", "edit");
    fixture.detectChanges();

    component.form.get("email")?.setValue("");
    expect(component.form.get("email")?.hasError("required")).toBe(true);
  });

  it("should validate email format", () => {
    fixture.componentRef.setInput("mode", "edit");
    fixture.detectChanges();

    component.form.get("email")?.setValue("invalid-email");
    expect(component.form.get("email")?.hasError("email")).toBe(true);

    component.form.get("email")?.setValue("valid@email.com");
    expect(component.form.get("email")?.hasError("email")).toBe(false);
  });

  it("should emit formSubmit when form is valid", () => {
    fixture.componentRef.setInput("mode", "edit");
    fixture.componentRef.setInput("availableRoles", [mockRole]);
    fixture.detectChanges();

    const submitSpy = jasmine.createSpy("formSubmit");
    component.formSubmit.subscribe(submitSpy);

    component.form.patchValue({
      email: "test@example.com",
      roles: [mockRole],
    });

    component.onSubmit();

    expect(submitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        email: "test@example.com",
        roles: [mockRole],
      }),
    );
  });

  it("should not emit formSubmit when form is invalid", () => {
    fixture.componentRef.setInput("mode", "edit");
    fixture.detectChanges();

    const submitSpy = jasmine.createSpy("formSubmit");
    component.formSubmit.subscribe(submitSpy);

    component.form.patchValue({ email: "" }); // Invalid: required field empty
    component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("should emit formCancel when cancel is called", () => {
    const cancelSpy = jasmine.createSpy("formCancel");
    component.formCancel.subscribe(cancelSpy);

    component.onCancel();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it("should set and clear global errors", () => {
    component.setGlobalError("Test error message");
    expect(component.getGlobalError()).toBe("Test error message");

    component.clearErrors();
    expect(component.getGlobalError()).toBeNull();
  });
});
