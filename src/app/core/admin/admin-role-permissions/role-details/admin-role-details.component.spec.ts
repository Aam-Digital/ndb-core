import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router, provideRouter } from "@angular/router";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { of } from "rxjs";

import { AdminRoleDetailsComponent } from "./admin-role-details.component";
import { RolePermissionsService } from "../role-permissions.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { UnsavedChangesService } from "../../../entity-details/form/unsaved-changes.service";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { UserAdminApiError } from "../../../user/user-admin-service/user-admin.service";

describe("AdminRoleDetailsComponent", () => {
  let component: AdminRoleDetailsComponent;
  let fixture: ComponentFixture<AdminRoleDetailsComponent>;
  const mockRolePermissions = {
    loadRoles: vi.fn(),
    saveRules: vi.fn().mockResolvedValue(undefined),
    createRole: vi.fn().mockResolvedValue(undefined),
    deleteRole: vi.fn().mockResolvedValue(undefined),
    updateRoleDescription: vi.fn().mockResolvedValue(undefined),
    canManageRoles: vi.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRolePermissions.saveRules.mockResolvedValue(undefined);
    mockRolePermissions.createRole.mockResolvedValue(undefined);
    mockRolePermissions.deleteRole.mockResolvedValue(undefined);
    mockRolePermissions.canManageRoles.mockReturnValue(true);
    mockRolePermissions.loadRoles.mockResolvedValue([
      {
        name: "user_app",
        isVirtual: false,
        isProtected: false,
        description: "Social workers",
        rules: [{ subject: "Child", action: "read" }],
      },
      { name: "volunteer", isVirtual: false, isProtected: false },
      {
        name: "account_manager",
        isVirtual: false,
        isProtected: true,
        description: "Technical role",
        rules: [],
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminRoleDetailsComponent],
      providers: [
        { provide: RolePermissionsService, useValue: mockRolePermissions },
        { provide: EntityRegistry, useValue: new EntityRegistry() },
        {
          provide: ConfirmationDialogService,
          useValue: {
            getDiscardConfirmation: vi.fn().mockResolvedValue(true),
            getConfirmation: vi.fn().mockResolvedValue(true),
          },
        },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([["role", "user_app"]])),
            snapshot: { data: {} },
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);
    fixture = TestBed.createComponent(AdminRoleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads the role from the route param and renders name, description and matrix", async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const fieldValues = Array.from(
      fixture.nativeElement.querySelectorAll(
        "input[matinput], textarea[matinput]",
      ),
    ).map((i: HTMLInputElement | HTMLTextAreaElement) => i.value);
    expect(fieldValues).toEqual(["user_app", "Social workers"]);
    expect(fixture.nativeElement.textContent).toContain("Child");
  });

  it("shows fallback hint for a role without any configured rules", async () => {
    mockRolePermissions.loadRoles.mockResolvedValue([
      { name: "volunteer", isVirtual: false },
    ]);
    component.roleName.set("volunteer");
    await component.loadRole();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "No permissions defined",
    );
  });

  it("tracks unsaved changes while editing and saves the working model as rules", async () => {
    await fixture.whenStable();
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    component.startEditing();
    component.onModelChange({
      rows: [
        { subject: "Child", cells: { read: { allowed: true } } },
        { subject: "School", cells: { read: { allowed: true } } },
      ],
      unsupportedRules: [],
    });
    expect(unsavedChanges.pending()).toBe(true);

    await component.save();

    expect(mockRolePermissions.saveRules).toHaveBeenCalledWith("user_app", [
      { subject: ["Child", "School"], action: "read" },
    ]);
    expect(component.editing()).toBe(false);
    expect(unsavedChanges.pending()).toBe(false);
  });

  it("keeps edit mode and reports an error when saving permissions fails", async () => {
    await fixture.whenStable();
    const openSpy = vi.spyOn(TestBed.inject(MatSnackBar), "open");
    mockRolePermissions.saveRules.mockRejectedValue(new Error("boom"));

    component.startEditing();
    await component.save();

    expect(component.editing()).toBe(true);
    expect(openSpy).toHaveBeenCalled();
  });

  it("cancel discards working changes and clears unsaved state", async () => {
    await fixture.whenStable();
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    component.startEditing();
    component.onModelChange({ rows: [], unsupportedRules: [] });
    component.cancel();

    expect(component.editing()).toBe(false);
    expect(unsavedChanges.pending()).toBe(false);
    expect(component.model().rows.map((r) => r.subject)).toEqual(["Child"]);
    expect(mockRolePermissions.saveRules).not.toHaveBeenCalled();
  });

  it("creates a new role only with valid unique name and navigates to its detail view", async () => {
    component.isNew.set(true);
    component.editing.set(true);
    component.nameControl.enable();
    component.model.set({ rows: [], unsupportedRules: [] });
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    component.nameControl.setValue("bad name!");
    await component.save();
    expect(mockRolePermissions.createRole).not.toHaveBeenCalled();

    component.nameControl.setValue("field_supervisor");
    component.descriptionControl.setValue("Sups");
    await component.save();

    expect(mockRolePermissions.createRole).toHaveBeenCalledWith(
      "field_supervisor",
      "Sups",
      [],
    );
    expect(navigateSpy).toHaveBeenCalled();
  });

  it("does not navigate when creating the role fails", async () => {
    component.isNew.set(true);
    component.editing.set(true);
    component.nameControl.enable();
    component.model.set({ rows: [], unsupportedRules: [] });
    mockRolePermissions.createRole.mockRejectedValue(new Error("403"));
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    component.nameControl.setValue("field_supervisor");
    await component.save();

    expect(mockRolePermissions.createRole).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("rejects a role name with the reserved leading underscore", () => {
    component.isNew.set(true);
    component.nameControl.enable();

    component.nameControl.setValue("_myrole");
    expect(component.nameControl.hasError("pattern")).toBe(true);

    component.nameControl.setValue("myrole");
    expect(component.nameControl.hasError("pattern")).toBe(false);
  });

  it("surfaces the specific server error message when creation is rejected", async () => {
    const openSpy = vi.spyOn(TestBed.inject(MatSnackBar), "open");
    component.isNew.set(true);
    component.editing.set(true);
    component.nameControl.enable();
    component.model.set({ rows: [], unsupportedRules: [] });
    mockRolePermissions.createRole.mockRejectedValue(
      new UserAdminApiError(409, "A role with this name already exists."),
    );

    component.nameControl.setValue("duplicate_role");
    await component.save();

    expect(openSpy).toHaveBeenCalledWith(
      "A role with this name already exists.",
      undefined,
      expect.anything(),
    );
  });

  it("deletes the role after confirmation and navigates back to the list", async () => {
    await fixture.whenStable();
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    await component.deleteRole();

    expect(
      TestBed.inject(ConfirmationDialogService).getConfirmation,
    ).toHaveBeenCalled();
    expect(mockRolePermissions.deleteRole).toHaveBeenCalledWith("user_app");
    expect(navigateSpy).toHaveBeenCalled();
  });

  it("does not navigate when deleting the role fails", async () => {
    await fixture.whenStable();
    mockRolePermissions.deleteRole.mockRejectedValue(new Error("403"));
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    await component.deleteRole();

    expect(mockRolePermissions.deleteRole).toHaveBeenCalledWith("user_app");
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("protects a technical role: no delete button and read-only description", async () => {
    component.roleName.set("account_manager");
    await component.loadRole();
    fixture.detectChanges();

    expect(component.isProtected()).toBe(true);
    // view mode: no delete button is rendered for a protected role
    const deleteButton = Array.from(
      fixture.nativeElement.querySelectorAll("button"),
    ).find((b: HTMLButtonElement) => b.textContent?.includes("Delete"));
    expect(deleteButton).toBeUndefined();

    // the description stays read-only even after entering edit mode
    component.startEditing();
    expect(component.descriptionEditable()).toBe(false);
    expect(component.descriptionControl.disabled).toBe(true);
  });
});
