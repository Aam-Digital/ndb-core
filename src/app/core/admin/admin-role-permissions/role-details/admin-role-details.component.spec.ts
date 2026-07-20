import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { of } from "rxjs";

import { AdminRoleDetailsComponent } from "./admin-role-details.component";
import { RolePermissionsService } from "../role-permissions.service";
import { JsonEditorService } from "../../json-editor/json-editor.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";

describe("AdminRoleDetailsComponent", () => {
  let component: AdminRoleDetailsComponent;
  let fixture: ComponentFixture<AdminRoleDetailsComponent>;
  const mockRolePermissions = {
    loadRoles: vi.fn(),
    saveRules: vi.fn().mockResolvedValue(undefined),
  };
  const mockJsonEditor = { openJsonEditorDialog: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRolePermissions.saveRules.mockResolvedValue(undefined);
    mockRolePermissions.loadRoles.mockResolvedValue([
      {
        name: "user_app",
        isVirtual: false,
        description: "Social workers",
        rules: [{ subject: "Child", action: "read" }],
      },
      { name: "volunteer", isVirtual: false },
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminRoleDetailsComponent],
      providers: [
        { provide: RolePermissionsService, useValue: mockRolePermissions },
        { provide: JsonEditorService, useValue: mockJsonEditor },
        { provide: EntityRegistry, useValue: new EntityRegistry() },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(new Map([["role", "user_app"]])) },
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

    const inputValues = Array.from(
      fixture.nativeElement.querySelectorAll("input[matinput]"),
    ).map((i: HTMLInputElement) => i.value);
    expect(inputValues).toEqual(["user_app", "Social workers"]);
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

  it("saves rules edited through the json editor", async () => {
    await fixture.whenStable();
    const edited = [{ subject: "School", action: "read" }];
    mockJsonEditor.openJsonEditorDialog.mockReturnValue(of(edited));

    await component.editJson();

    expect(mockJsonEditor.openJsonEditorDialog).toHaveBeenCalledWith([
      { subject: "Child", action: "read" },
    ]);
    expect(mockRolePermissions.saveRules).toHaveBeenCalledWith(
      "user_app",
      edited,
    );
  });
});
