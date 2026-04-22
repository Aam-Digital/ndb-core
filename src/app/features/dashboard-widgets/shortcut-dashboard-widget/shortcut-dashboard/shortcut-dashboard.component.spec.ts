import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ShortcutDashboardComponent } from "./shortcut-dashboard.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { UserRoleGuard } from "../../../../core/permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../../../core/permissions/permission-guard/entity-permission.guard";
import { MenuItem } from "../../../../core/ui/navigation/menu-item";

describe("ShortcutDashboardComponent", () => {
  let component: ShortcutDashboardComponent;
  let fixture: ComponentFixture<ShortcutDashboardComponent>;
  let mockRoleGuard: any;
  let mockPermissionGuard: any;

  beforeEach(async () => {
    mockRoleGuard = {
      checkRoutePermissions: vi.fn(),
    };
    mockPermissionGuard = {
      checkRoutePermissions: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ShortcutDashboardComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: undefined },
        { provide: UserRoleGuard, useValue: mockRoleGuard },
        { provide: EntityPermissionGuard, useValue: mockPermissionGuard },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortcutDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only show routes to which the user has access", async () => {
    vi.useFakeTimers();
    try {
      mockRoleGuard.checkRoutePermissions.mockImplementation(async (route) => {
        switch (route) {
          case "/child":
            return true;
          case "/school":
            return false;
        }
      });
      mockPermissionGuard.checkRoutePermissions.mockResolvedValue(true);
      const childItem: MenuItem = {
        label: "Children",
        icon: "child",
        link: "/child",
      };
      const schoolItem: MenuItem = {
        label: "School",
        icon: "building",
        link: "/school",
      };

      fixture.componentRef.setInput("shortcuts", [childItem, schoolItem]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.filteredShortcuts()).toEqual([childItem]);
    } finally {
      vi.useRealTimers();
    }
  });
});
