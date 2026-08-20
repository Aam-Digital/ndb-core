import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { FeaturePermissionDialogComponent } from "./feature-permission-dialog.component";
import {
  FeatureAction,
  FeaturePermissionService,
} from "../feature-permission.service";
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

  function permissions(
    granted: FeatureAction[],
    editable: FeatureAction[],
  ): Record<FeatureAction, { granted: boolean; editable: boolean }> {
    return Object.fromEntries(
      (["create", "read", "update", "delete"] as FeatureAction[]).map(
        (action) => [
          action,
          {
            granted: granted.includes(action),
            editable: editable.includes(action),
          },
        ],
      ),
    ) as Record<FeatureAction, { granted: boolean; editable: boolean }>;
  }

  /** default state: shared read access, one read-only role and one editable role */
  function defaultState() {
    return {
      entityType: ENTITY_TYPE,
      defaultRules: {
        role: "_default",
        actions: permissions(["read"], []),
        editable: false,
      },
      roles: [
        {
          role: "user_app",
          actions: permissions(["create", "read", "update", "delete"], []),
          editable: false,
        },
        {
          role: "assistant_app",
          actions: permissions(["read"], ["create", "update", "delete"]),
          editable: true,
        },
      ],
      hasComplexRules: true,
    };
  }

  async function createAndInit() {
    fixture = TestBed.createComponent(FeaturePermissionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
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

  it("should list the shared default rules above the roles, with descriptions from the auth server", async () => {
    await createAndInit();

    expect(
      component
        .rows()
        .map((row) => [row.role, row.label, row.isDefaultRow, row.description]),
    ).toEqual([
      ["_default", "Default", true, "(applies to any logged-in user)"],
      ["user_app", "user_app", false, "App user"],
      ["assistant_app", "assistant_app", false, undefined],
    ]);
    expect(mockPermissionService.getPermissions).toHaveBeenCalledWith(
      ENTITY_TYPE,
      ["user_app", "assistant_app"],
    );
    expect(component.hasComplexRules()).toBe(true);
  });

  it("should merge roles that only exist in the permissions config when the auth server is unavailable", async () => {
    mockUserAdmin.getAllRoles.mockReturnValue(
      throwError(() => new Error("keycloak unavailable")),
    );

    await createAndInit();

    expect(mockPermissionService.getPermissions).toHaveBeenCalledWith(
      ENTITY_TYPE,
      ["user_app", "assistant_app"],
    );
    expect(component.permissionRows.error()).toBeUndefined();
  });

  it.each([
    ["no roles can be determined", () => Promise.resolve([])],
    [
      "loading the permissions fails",
      () => Promise.reject(new Error("offline")),
    ],
  ])("should show an error when %s", async (_name, configuredRoles) => {
    mockUserAdmin.getAllRoles.mockReturnValue(of([]));
    mockPermissionService.getConfiguredRoleNames.mockImplementation(
      configuredRoles,
    );

    await createAndInit();

    expect(component.permissionRows.error()).toBeTruthy();
    expect(component.rows()).toEqual([]);
  });

  it("should save only the editable role rows and offer an undo", async () => {
    await createAndInit();

    component.setAction("assistant_app", "create", true);
    await component.confirm();

    expect(mockPermissionService.setPermissions).toHaveBeenCalledWith(
      ENTITY_TYPE,
      [
        {
          role: "assistant_app",
          actions: {
            create: true,
            read: true,
            update: false,
            delete: false,
          },
        },
      ],
    );
    expect(mockPermissionsConfig.offerUndo).toHaveBeenCalledWith(
      backupConfig,
      expect.stringContaining("Export Templates"),
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it("should keep the dialog open and inform the user when saving fails", async () => {
    mockPermissionService.setPermissions.mockRejectedValue(
      new Error("conflict"),
    );

    await createAndInit();
    await component.confirm();

    expect(mockSnackBar.open).toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });
});
