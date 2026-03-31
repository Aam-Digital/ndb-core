import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MergeAccountSectionComponent } from "./merge-account-section.component";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { of, throwError } from "rxjs";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";

@DatabaseEntity("TestEntityWithUserAccountsSection")
class TestEntityWithUserAccounts extends Entity {
  static override readonly enableUserAccounts = true;
}

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

  let entity0: TestEntityWithUserAccounts;
  let entity1: TestEntityWithUserAccounts;

  beforeEach(async () => {
    entity0 = new TestEntityWithUserAccounts();
    entity1 = new TestEntityWithUserAccounts();

    mockUserAdminService = {
      getAllRoles: vi.fn().mockReturnValue(
        of([
          { id: "role-1", name: "Admin" },
          { id: "role-2", name: "User" },
        ]),
      ),
      updateUser: vi.fn().mockReturnValue(of({ userUpdated: true })),
      getUser: vi.fn().mockImplementation((entityId: string) => {
        if (entityId === entity0.getId()) return of(mockAccount0);
        if (entityId === entity1.getId()) return of(mockAccount1);
        return throwError(() => ({ status: 404 }));
      }),
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
    fixture.componentRef.setInput("entitiesToMerge", [entity0, entity1]);
    fixture.componentRef.setInput(
      "entityConstructor",
      TestEntityWithUserAccounts,
    );
  });

  it("should load accounts and pre-select the email from the account at index 0 by default", async () => {
    await component.ngOnInit();

    expect(component.entityAccounts()).toEqual([mockAccount0, mockAccount1]);
    expect(component.selectedAccountEmailIndex()).toBe(0);
  });

  it("should set primaryIndex to 1 when only the entity at index 1 has an account", async () => {
    mockUserAdminService.getUser.mockImplementation((entityId: string) => {
      if (entityId === entity1.getId()) return of(mockAccount1);
      return throwError(() => ({ status: 404 }));
    });

    await component.ngOnInit();

    expect(component.primaryIndex()).toBe(1);
  });

  it("should set primaryIndex to 0 when entity at index 0 has an account", async () => {
    await component.ngOnInit();

    expect(component.primaryIndex()).toBe(0);
  });

  it("should set accountLoadError when getUser API fails with non-404 error", async () => {
    mockUserAdminService.getUser.mockReturnValue(
      throwError(() => ({ status: 500 })),
    );

    await component.ngOnInit();

    expect(component.accountLoadError()).toBe(true);
    expect(component.entityAccounts()).toEqual([null, null]);
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

  it("should return update payload from buildAccountUpdate when email is changed", async () => {
    await component.ngOnInit();

    component.accountEmailControl().setValue("new@test.com");
    component.accountEmailControl().markAsDirty();
    component.accountForm()!.markAsDirty();

    const result = component.buildAccountUpdate();

    expect(result).toEqual(
      expect.objectContaining({ accountId: mockAccount0.id }),
    );
    expect(result?.update).toEqual(
      expect.objectContaining({ email: "new@test.com" }),
    );
  });

  it("should return null from buildAccountUpdate when form is not dirty", async () => {
    await component.ngOnInit();

    expect(component.buildAccountUpdate()).toBeNull();
  });

  it("should return false from validateAndGetUpdate when accountForm is invalid", async () => {
    await component.ngOnInit();

    component.accountEmailControl().setValue("not-an-email");
    component.accountEmailControl().markAsDirty();
    component.accountForm()!.markAsDirty();

    expect(await component.validateAndGetUpdate()).toBe(false);
  });

  it("should update selectedAccountEmailIndex when selectAccountEmail is called", async () => {
    await component.ngOnInit();

    component.selectAccountEmail(1);

    expect(component.selectedAccountEmailIndex()).toBe(1);
    expect(component.accountEmailControl().value).toBe(mockAccount1.email);
  });

  it("should add roles when toggleAccountRoles is called with checked=true", async () => {
    await component.ngOnInit();
    // start with no roles selected
    component.accountRolesControl().setValue([]);

    component.toggleAccountRoles(1, true);

    const selected = component.accountRolesControl().value as any[];
    expect(selected.some((r) => r.id === "role-2")).toBe(true);
  });

  it("should remove roles when toggleAccountRoles is called with checked=false", async () => {
    await component.ngOnInit();

    component.toggleAccountRoles(0, false);

    const selected = component.accountRolesControl().value as any[];
    expect(selected.some((r) => r.id === "role-1")).toBe(false);
  });

  it("should not initialize accountForm when no accounts exist", async () => {
    mockUserAdminService.getUser.mockReturnValue(
      throwError(() => ({ status: 404 })),
    );

    await component.ngOnInit();

    expect(component.accountForm()).toBeNull();
    expect(component.hasAnyUserAccount()).toBe(false);
  });
});
