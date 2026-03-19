import { TestBed } from "@angular/core/testing";

import { RoutePermissionsService } from "./route-permissions.service";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import type { Mock } from "vitest";

type UserRoleGuardMock = {
  checkRoutePermissions: Mock;
};

type EntityPermissionGuardMock = {
  checkRoutePermissions: Mock;
};

describe("RoutePermissionsService", () => {
  let service: RoutePermissionsService;

  let mockUserRoleGuard: UserRoleGuardMock;
  let mockEntityPermissionGuard: EntityPermissionGuardMock;

  beforeEach(() => {
    mockEntityPermissionGuard = {
      checkRoutePermissions: vi.fn(),
    };
    mockEntityPermissionGuard.checkRoutePermissions.mockResolvedValue(true);

    mockUserRoleGuard = {
      checkRoutePermissions: vi.fn(),
    };
    mockUserRoleGuard.checkRoutePermissions.mockImplementation(
      async (path: string) => {
        if (path === "allowed") {
          return true;
        } else {
          return false;
        }
      },
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: UserRoleGuard, useValue: mockUserRoleGuard },
        { provide: EntityPermissionGuard, useValue: mockEntityPermissionGuard },
      ],
    });
    service = TestBed.inject(RoutePermissionsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should filter menu-items where user doesn't have permission for its link", async () => {
    const itemPermitted: MenuItem = {
      label: "Visible Item",
      link: "allowed",
    };
    const itemProtected: MenuItem = {
      label: "Hidden Item",
      link: "blocked",
    };

    const filteredItems: MenuItem[] = await service.filterPermittedRoutes([
      itemPermitted,
      itemProtected,
    ]);

    expect(filteredItems).toEqual([itemPermitted]);
  });

  it("should filter each submenu item based on permissions", async () => {
    const itemPermitted: MenuItem = {
      label: "Visible Item",
      link: "allowed",
    };
    const itemProtected: MenuItem = {
      label: "Hidden Item",
      link: "blocked",
    };
    const nestedItem: MenuItem = {
      label: "Parent Item",
      subMenu: [itemPermitted, itemProtected],
    };

    const filteredItems: MenuItem[] = await service.filterPermittedRoutes([
      nestedItem,
    ]);

    expect(filteredItems).toEqual([
      {
        label: "Parent Item",
        subMenu: [itemPermitted],
      },
    ]);
  });

  it("should filter parent item if all submenu items are filter due to permissions", async () => {
    const nestedItem: MenuItem = {
      label: "Parent Item",
      subMenu: [
        {
          label: "Hidden Item 1",
          link: "blocked",
        },
        {
          label: "Hidden Item 2",
          link: "blocked",
        },
      ],
    };

    const filteredItems: MenuItem[] = await service.filterPermittedRoutes([
      nestedItem,
    ]);

    expect(filteredItems).toEqual([]);
  });

  it("should include link-less parent items only when they have at least one accessible child", async () => {
    // Link-less parent with an accessible child → included
    const linklessParentWithChild: MenuItem = {
      label: "Section",
      icon: "folder",
      subMenu: [{ label: "Allowed", link: "allowed" }],
    };

    // Link-less parent with no children → excluded (dead row)
    const linklessLeaf: MenuItem = { label: "More", icon: "folder" };

    // Link-less parent whose only child is blocked → excluded
    const linklessParentAllBlocked: MenuItem = {
      label: "Hidden Section",
      icon: "folder",
      subMenu: [{ label: "Blocked", link: "blocked" }],
    };

    const filteredItems: MenuItem[] = await service.filterPermittedRoutes([
      linklessParentWithChild,
      linklessLeaf,
      linklessParentAllBlocked,
    ]);

    expect(filteredItems.length).toBe(1);
    expect(filteredItems[0].label).toBe("Section");
  });
});
