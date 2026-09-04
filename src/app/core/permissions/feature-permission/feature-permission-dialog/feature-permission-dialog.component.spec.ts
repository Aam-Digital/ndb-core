import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { FeaturePermissionDialogComponent } from "./feature-permission-dialog.component";
import { DEFAULT_ROLE } from "../../reserved-roles";
import {
  FeatureAction,
  FeatureActionPermission,
  FeaturePermissionService,
  PermissionLockReason,
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

  const ALL_ACTIONS: FeatureAction[] = ["create", "read", "update", "delete"];

  /**
   * The actions of one row as the service reports them.
   * @param granted the effective grants, i.e. including what `_default` adds
   * @param editable the checkboxes that are not decided by another rule
   * @param lockedBy why the remaining checkboxes are locked
   * @param ownRules the row's own grants, defaulting to the effective ones
   */
  function permissions(
    granted: FeatureAction[],
    editable: FeatureAction[],
    lockedBy?: PermissionLockReason,
    ownRules: FeatureAction[] = granted,
  ): Record<FeatureAction, FeatureActionPermission> {
    return Object.fromEntries(
      ALL_ACTIONS.map((action) => [
        action,
        {
          granted: granted.includes(action),
          grantedByOwnRule: ownRules.includes(action),
          editable: editable.includes(action),
          ...(editable.includes(action) ? {} : { lockedBy }),
        },
      ]),
    ) as Record<FeatureAction, FeatureActionPermission>;
  }

  /**
   * default state: the shared section grants read (and can be edited), one role
   * is read-only through an advanced rule and one role inherits the read grant
   */
  function defaultState() {
    return {
      entityType: ENTITY_TYPE,
      defaultRules: {
        role: "_default",
        actions: permissions(["read"], ALL_ACTIONS),
        editable: true,
      },
      roles: [
        {
          role: "user_app",
          actions: permissions(ALL_ACTIONS, [], "advanced-rule"),
          editable: false,
        },
        {
          role: "assistant_app",
          // "read" is inherited from the shared section, nothing of its own
          actions: permissions(
            ["read"],
            ["create", "update", "delete"],
            "default",
            [],
          ),
          editable: true,
        },
      ],
    };
  }

  /** the displayed state of one row's checkboxes, as a compact string per action */
  function displayed(role: string): Record<string, string> {
    const row = component.displayRows().find((r) => r.role === role);
    return Object.fromEntries(
      row.cells.map((cell) => [
        cell.action,
        `${cell.granted ? "granted" : "-"}/${cell.editable ? "editable" : "locked"}`,
      ]),
    );
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
      ["_default", DEFAULT_ROLE.label, true, DEFAULT_ROLE.appliesTo],
      ["user_app", "user_app", false, "App user"],
      ["assistant_app", "assistant_app", false, undefined],
    ]);
    expect(mockPermissionService.getPermissions).toHaveBeenCalledWith(
      ENTITY_TYPE,
      ["user_app", "assistant_app"],
    );
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

  it("should show an action granted by the shared section as ticked and locked on a role", async () => {
    await createAndInit();

    expect(displayed("assistant_app")).toEqual({
      create: "-/editable",
      read: "granted/locked",
      update: "-/editable",
      delete: "-/editable",
    });
    // and the whole row of a role decided by an advanced rule stays read-only
    expect(displayed("user_app")).toEqual({
      create: "granted/locked",
      read: "granted/locked",
      update: "granted/locked",
      delete: "granted/locked",
    });
  });

  it("should unlock the role checkboxes as soon as the shared section stops granting the action", async () => {
    await createAndInit();

    component.setAction("_default", "read", false);

    expect(displayed("assistant_app").read).toBe("-/editable");
    // an advanced rule still decides this row, whatever the shared section says
    expect(displayed("user_app").read).toBe("granted/locked");
  });

  it("should reveal a role's own grant again when the shared section stops granting the action", async () => {
    const state = defaultState();
    // the role has an own "read" rule on top of the inherited one
    state.roles[1].actions = permissions(
      ["read"],
      ["create", "update", "delete"],
      "default",
      ["read"],
    );
    mockPermissionService.getPermissions.mockResolvedValue(state);

    await createAndInit();
    component.setAction("_default", "read", false);

    expect(displayed("assistant_app").read).toBe("granted/editable");
  });

  it("should save the editable rows including the shared section, and offer an undo", async () => {
    await createAndInit();

    component.setAction("assistant_app", "create", true);
    await component.confirm();

    expect(mockPermissionService.setPermissions).toHaveBeenCalledWith(
      ENTITY_TYPE,
      [
        {
          role: "_default",
          actions: {
            create: false,
            read: true,
            update: false,
            delete: false,
          },
        },
        {
          role: "assistant_app",
          // "read" is inherited, so it is not written as the role's own rule
          actions: {
            create: true,
            read: false,
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

  it("should not save the shared section when an advanced rule decides it", async () => {
    const state = defaultState();
    state.defaultRules = {
      role: "_default",
      actions: permissions(ALL_ACTIONS, [], "advanced-rule"),
      editable: false,
    };
    mockPermissionService.getPermissions.mockResolvedValue(state);

    await createAndInit();
    await component.confirm();

    expect(
      mockPermissionService.setPermissions.mock.calls[0][1].map(
        (update) => update.role,
      ),
    ).toEqual(["assistant_app"]);
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
