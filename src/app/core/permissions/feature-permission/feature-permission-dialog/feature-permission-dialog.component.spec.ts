import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { FeaturePermissionDialogComponent } from "./feature-permission-dialog.component";
import { FeaturePermissionService } from "../feature-permission.service";
import { PermissionsConfigService } from "../../permissions-config.service";
import { UserAdminService } from "../../../user/user-admin-service/user-admin.service";
import { Config } from "../../../config/config";

describe("FeaturePermissionDialogComponent", () => {
  let fixture: ComponentFixture<FeaturePermissionDialogComponent>;
  let component: FeaturePermissionDialogComponent;

  let mockPermissionService: {
    getPermissions: ReturnType<typeof vi.fn>;
    setPermissions: ReturnType<typeof vi.fn>;
    getConfiguredRoleNames: ReturnType<typeof vi.fn>;
  };
  let mockPermissionsConfig: { offerUndo: ReturnType<typeof vi.fn> };
  let mockUserAdmin: { getAllRoles: ReturnType<typeof vi.fn> };
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  const ENTITY_TYPE = "TemplateExport";
  const backupConfig = new Config(Config.PERMISSION_KEY + ":backup", {});

  /** default state: one read-only wildcard role and one editable role */
  function defaultState() {
    return {
      entityType: ENTITY_TYPE,
      roles: [
        { role: "user_app", use: true, manage: true, editable: false },
        { role: "assistant_app", use: false, manage: false, editable: true },
      ],
      hasComplexRules: true,
    };
  }

  async function createAndInit() {
    fixture = TestBed.createComponent(FeaturePermissionDialogComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
  }

  beforeEach(async () => {
    mockPermissionService = {
      getPermissions: vi.fn().mockResolvedValue(defaultState()),
      setPermissions: vi.fn().mockResolvedValue(backupConfig),
      getConfiguredRoleNames: vi
        .fn()
        .mockResolvedValue(["user_app", "assistant_app"]),
    };
    mockPermissionsConfig = { offerUndo: vi.fn() };
    mockUserAdmin = {
      getAllRoles: vi
        .fn()
        .mockReturnValue(
          of([{ id: "1", name: "user_app", description: "App user" }]),
        ),
    };
    mockDialogRef = { close: vi.fn() };
    mockSnackBar = {
      open: vi.fn().mockReturnValue({ onAction: () => of(undefined) }),
    };

    await TestBed.configureTestingModule({
      imports: [
        FeaturePermissionDialogComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        provideRouter([]),
        { provide: FeaturePermissionService, useValue: mockPermissionService },
        {
          provide: PermissionsConfigService,
          useValue: mockPermissionsConfig,
        },
        { provide: UserAdminService, useValue: mockUserAdmin },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entityType: ENTITY_TYPE,
            entityLabel: "Export Templates",
          },
        },
      ],
    }).compileComponents();
  });

  it("should create", () => {
    fixture = TestBed.createComponent(FeaturePermissionDialogComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it("should merge auth-server roles with config roles and map to rows", async () => {
    await createAndInit();

    // both sources merged, Keycloak roles first, and passed to the service
    expect(mockPermissionService.getPermissions).toHaveBeenCalledWith(
      ENTITY_TYPE,
      ["user_app", "assistant_app"],
    );

    const rows = component.roles();
    expect(rows).toEqual([
      {
        role: "user_app",
        description: "App user",
        use: true,
        manage: true,
        editable: false,
        useAriaLabel: expect.stringContaining("user_app"),
        manageAriaLabel: expect.stringContaining("user_app"),
      },
      {
        role: "assistant_app",
        description: undefined,
        use: false,
        manage: false,
        editable: true,
        useAriaLabel: expect.stringContaining("assistant_app"),
        manageAriaLabel: expect.stringContaining("assistant_app"),
      },
    ]);
    expect(component.hasComplexRules()).toBe(true);
  });

  it("should fall back to config roles when the auth server is unavailable", async () => {
    mockUserAdmin.getAllRoles.mockReturnValue(
      throwError(() => new Error("no admin API")),
    );

    await createAndInit();

    expect(mockPermissionService.getConfiguredRoleNames).toHaveBeenCalled();
    const roleNames = component.roles()?.map((r) => r.role);
    expect(roleNames).toEqual(["user_app", "assistant_app"]);
  });

  it("should show a load error when no roles are available", async () => {
    mockUserAdmin.getAllRoles.mockReturnValue(of([]));
    mockPermissionService.getConfiguredRoleNames.mockResolvedValue([]);

    await createAndInit();

    expect(component.loadError()).toBe(true);
    expect(component.roles()).toEqual([]);
    expect(mockPermissionService.getPermissions).not.toHaveBeenCalled();
  });

  it("should update a role immutably via setUse and setManage", async () => {
    await createAndInit();
    const before = component.roles();

    component.setManage("assistant_app", true);
    component.setUse("assistant_app", true);

    const after = component.roles();
    expect(after).not.toBe(before); // new array reference -> OnPush re-renders
    expect(after?.find((r) => r.role === "assistant_app")).toEqual(
      expect.objectContaining({ use: true, manage: true }),
    );
    // other rows untouched
    expect(after?.find((r) => r.role === "user_app")?.manage).toBe(true);
  });

  it("should persist only editable rows on confirm and offer an undo", async () => {
    await createAndInit();

    await component.confirm();

    expect(mockPermissionService.setPermissions).toHaveBeenCalledWith(
      ENTITY_TYPE,
      [{ role: "assistant_app", use: false, manage: false }],
    );
    expect(mockPermissionsConfig.offerUndo).toHaveBeenCalledWith(
      backupConfig,
      expect.any(String),
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it("should keep the dialog open and warn when saving fails", async () => {
    mockPermissionService.setPermissions.mockRejectedValue(
      new Error("database unreachable"),
    );

    await createAndInit();
    await component.confirm();

    expect(mockSnackBar.open).toHaveBeenCalled();
    expect(mockPermissionsConfig.offerUndo).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });
});
