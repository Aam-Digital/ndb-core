import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MergeAccountSectionComponent } from "./merge-account-section.component";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { of, throwError } from "rxjs";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";

@DatabaseEntity("TestEntityWithUserAccountsSection")
class TestEntityWithUserAccounts extends Entity {
  static override readonly enableUserAccounts = true;
}

describe("MergeAccountSectionComponent", () => {
  let component: MergeAccountSectionComponent;
  let fixture: ComponentFixture<MergeAccountSectionComponent>;
  let mockUserAdminService: any;
  let mockConfirmationDialog: any;

  const mockAccount0 = {
    id: "kc-1",
    email: "a@test.com",
    enabled: true,
    roles: [{ id: "role-1", name: "Admin" }],
  };
  const mockAccount1 = {
    id: "kc-2",
    email: "b@test.com",
    enabled: false,
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
          { id: "role-3", name: "Manager" },
        ]),
      ),
      getUser: vi.fn().mockImplementation((entityId: string) => {
        if (entityId === entity0.getId()) return of(mockAccount0);
        if (entityId === entity1.getId()) return of(mockAccount1);
        return throwError(() => ({ status: 404 }));
      }),
    };
    mockConfirmationDialog = {
      getConfirmation: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [MergeAccountSectionComponent],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
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

  it("should use expansion panel to display account fields", async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector("mat-expansion-panel");
    expect(panel).toBeTruthy();
    expect(panel.classList).toContain("mat-expanded");
  });

  it("should hide expansion panel when no linked account exists and no load error occurred", async () => {
    mockUserAdminService.getUser.mockReturnValue(
      throwError(() => ({ status: 404 })),
    );

    await component.ngOnInit();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector("mat-expansion-panel");
    expect(panel).toBeFalsy();
  });

  it("should load accounts and select index 0 by default", async () => {
    await component.ngOnInit();

    expect(component.entityAccounts()).toEqual([mockAccount0, mockAccount1]);
    expect(component.primaryIndex()).toBe(0);
    expect(component.selectedAccountIndex()).toBe(0);
  });

  it("should render account section without throwing when accounts are present before async init completes", () => {
    component.entityAccounts.set([mockAccount0, mockAccount1]);

    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it("should hide second record radio button when no second account email exists", async () => {
    mockUserAdminService.getUser.mockImplementation((entityId: string) => {
      if (entityId === entity0.getId()) return of(mockAccount0);
      return throwError(() => ({ status: 404 }));
    });
    await component.ngOnInit();
    fixture.detectChanges();

    const radioButtons =
      fixture.nativeElement.querySelectorAll("mat-radio-button");
    expect(radioButtons.length).toBe(1);
  });

  it("should keep the available account selected when only first record has user account", async () => {
    mockUserAdminService.getUser.mockImplementation((entityId: string) => {
      if (entityId === entity0.getId()) return of(mockAccount0);
      return throwError(() => ({ status: 404 }));
    });
    await component.ngOnInit();
    fixture.detectChanges();

    const selectedRadio = fixture.nativeElement.querySelector(
      "input[type='radio']",
    ) as HTMLInputElement;
    expect(component.selectedAccountIndex()).toBe(0);
    expect(selectedRadio?.checked).toBe(true);
  });

  it("should keep the available account selected when only second record has user account", async () => {
    mockUserAdminService.getUser.mockImplementation((entityId: string) => {
      if (entityId === entity1.getId()) return of(mockAccount1);
      return throwError(() => ({ status: 404 }));
    });
    await component.ngOnInit();
    fixture.detectChanges();

    const selectedRadio = fixture.nativeElement.querySelector(
      "input[type='radio']",
    ) as HTMLInputElement;
    expect(component.selectedAccountIndex()).toBe(1);
    expect(selectedRadio?.checked).toBe(true);
  });

  it("should allow updating selected account roles", async () => {
    await component.ngOnInit();
    component.toggleAccountRoles(1, true);

    const decision = await component.validateAndGetDecision();
    if (!decision) {
      throw new Error("Expected a merge decision");
    }

    expect(decision.accountUpdate).toEqual({
      accountId: "kc-1",
      update: {
        roles: expect.arrayContaining([
          { id: "role-1", name: "Admin" },
          { id: "role-2", name: "User" },
        ]),
      },
    });
  });

  it("should return deleteSecondaryAccount=true when user clicks yes in both-accounts warning", async () => {
    await component.ngOnInit();
    mockConfirmationDialog.getConfirmation.mockResolvedValue(true);

    const decision = await component.validateAndGetDecision();
    if (!decision) {
      throw new Error("Expected a merge decision");
    }

    expect(decision.deleteSecondaryAccount).toBe(true);
  });

  it("should return deleteSecondaryAccount=false when user clicks no in both-accounts warning", async () => {
    await component.ngOnInit();
    mockConfirmationDialog.getConfirmation.mockResolvedValue(false);

    const decision = await component.validateAndGetDecision();
    if (!decision) {
      throw new Error("Expected a merge decision");
    }

    expect(decision.deleteSecondaryAccount).toBe(false);
  });

  it("should return false when user clicks cancel in both-accounts warning", async () => {
    await component.ngOnInit();
    mockConfirmationDialog.getConfirmation.mockResolvedValue(undefined);

    const decision = await component.validateAndGetDecision();

    expect(decision).toBe(false);
  });
});
