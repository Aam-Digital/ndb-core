import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MergeAccountSectionComponent } from "./merge-account-section.component";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { of, throwError } from "rxjs";

describe("MergeAccountSectionComponent", () => {
  let component: MergeAccountSectionComponent;
  let fixture: ComponentFixture<MergeAccountSectionComponent>;
  let mockUserAdminService: any;

  const mockAccount0 = {
    id: "kc-1",
    email: "a@test.com",
    enabled: true,
    roles: [{ id: "role-1", name: "Admin" }],
  };
  const mockAccount1 = {
    id: "kc-2",
    email: "b@test.com",
    enabled: true,
    roles: [{ id: "role-2", name: "User" }],
  };

  beforeEach(async () => {
    mockUserAdminService = {
      getAllRoles: vi.fn().mockReturnValue(
        of([
          { id: "role-1", name: "Admin" },
          { id: "role-2", name: "User" },
        ]),
      ),
      updateUser: vi.fn().mockReturnValue(of({ userUpdated: true })),
    };

    await TestBed.configureTestingModule({
      imports: [MergeAccountSectionComponent],
      providers: [
        FormBuilder,
        { provide: UserAdminService, useValue: mockUserAdminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MergeAccountSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entityAccounts", [
      mockAccount0,
      mockAccount1,
    ]);
    fixture.componentRef.setInput("accountLoadError", false);
    fixture.componentRef.setInput("entityConstructor", TestEntity);
  });

  it("should pre-select the email from the account at index 0 by default", async () => {
    await component.ngOnInit();

    expect(component.selectedAccountEmailIndex()).toBe(0);
  });

  it("should use fallback roles from accounts when getAllRoles fails", async () => {
    mockUserAdminService.getAllRoles.mockReturnValue(
      throwError(() => new Error("network error")),
    );
    await component.ngOnInit();

    expect(component.availableRoles()).toEqual([
      { id: "role-1", name: "Admin" },
      { id: "role-2", name: "User" },
    ]);
  });

  it("should call updateUser when accountForm has email changes", async () => {
    await component.ngOnInit();

    component.accountEmailControl().setValue("new@test.com");
    component.accountEmailControl().markAsDirty();
    component.accountForm()!.markAsDirty();

    await component.applyAccountUpdate();

    expect(mockUserAdminService.updateUser).toHaveBeenCalledWith(
      mockAccount0.id,
      expect.objectContaining({ email: "new@test.com" }),
    );
  });
});
