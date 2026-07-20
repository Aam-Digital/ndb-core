import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { of } from "rxjs";

import { AdminRolesListComponent } from "./admin-roles-list.component";
import { RolePermissionsService } from "../role-permissions.service";
import { JsonEditorService } from "../../json-editor/json-editor.service";
import { Config } from "../../../config/config";

describe("AdminRolesListComponent", () => {
  let component: AdminRolesListComponent;
  let fixture: ComponentFixture<AdminRolesListComponent>;
  const mockRolePermissions = {
    loadRoles: vi.fn(),
    loadPermissionsConfig: vi.fn(),
    savePermissionsConfig: vi.fn().mockResolvedValue(undefined),
  };
  const mockJsonEditor = {
    openJsonEditorDialog: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRolePermissions.savePermissionsConfig.mockResolvedValue(undefined);
    mockRolePermissions.loadRoles.mockResolvedValue([
      {
        name: "default",
        isVirtual: true,
        description: "Base permissions",
        rules: [
          { subject: "Child", action: "read" },
          { subject: "School", action: "read" },
        ],
      },
      {
        name: "volunteer",
        isVirtual: false,
        description: "Part-time volunteers",
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminRolesListComponent],
      providers: [
        { provide: RolePermissionsService, useValue: mockRolePermissions },
        { provide: JsonEditorService, useValue: mockJsonEditor },
        provideRouter([]),
      ],
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);
    fixture = TestBed.createComponent(AdminRolesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("renders roles with rule count or fallback hint for roles without rules", async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain("default");
    expect(text).toContain("2 rules");
    expect(text).toContain("volunteer");
    expect(text).toContain("No permissions defined");
  });

  it("opens json editor with current config and saves the edited permissions", async () => {
    mockRolePermissions.loadPermissionsConfig.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, { volunteer: [] }),
    );
    const edited = { volunteer: [{ subject: "Child", action: "read" }] };
    mockJsonEditor.openJsonEditorDialog.mockReturnValue(of(edited));

    await component.editJson();

    expect(mockJsonEditor.openJsonEditorDialog).toHaveBeenCalledWith({
      volunteer: [],
    });
    expect(mockRolePermissions.savePermissionsConfig).toHaveBeenCalledWith(
      edited,
    );
  });

  it("does not save when json editor is cancelled", async () => {
    mockRolePermissions.loadPermissionsConfig.mockResolvedValue(
      new Config(Config.PERMISSION_KEY, {}),
    );
    mockJsonEditor.openJsonEditorDialog.mockReturnValue(of(undefined));

    await component.editJson();

    expect(mockRolePermissions.savePermissionsConfig).not.toHaveBeenCalled();
  });
});
