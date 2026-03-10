import { TestBed } from "@angular/core/testing";

import { RoutePermissionsService } from "./route-permissions.service";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";
import { MenuItem } from "app/core/ui/navigation/menu-item";

describe("RoutePermissionsService", () => {
  let service: RoutePermissionsService;

  let mockUserRoleGuard: jasmine.SpyObj<UserRoleGuard>;
  let mockEntityPermissionGuard: jasmine.SpyObj<EntityPermissionGuard>;

  beforeEach(() => {
    mockEntityPermissionGuard = jasmine.createSpyObj(["checkRoutePermissions"]);
    mockEntityPermissionGuard.checkRoutePermissions.and.resolveTo(true);

    mockUserRoleGuard = jasmine.createSpyObj(["checkRoutePermissions"]);
    mockUserRoleGuard.checkRoutePermissions.and.callFake(
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

  it("should include link-less items (section headers) without permission checks", async () => {
    // A link-less item with no children should be included as a label header
    const linklessItem: MenuItem = { label: "More", icon: "folder" };

    // A link-less parent with an accessible linked child should be included
    const linklessParentWithChild: MenuItem = {
      label: "Section",
      icon: "folder",
      subMenu: [{ label: "Allowed", link: "allowed" }],
    };

    // A link-less parent whose only child is also link-less should be included
    const linklessParentWithLinklessChild: MenuItem = {
      label: "Group",
      icon: "folder",
      subMenu: [{ label: "Sub Header", icon: "tag" }],
    };

    const filteredItems: MenuItem[] = await service.filterPermittedRoutes([
      linklessItem,
      linklessParentWithChild,
      linklessParentWithLinklessChild,
    ]);

    expect(filteredItems.length).toBe(3);
    expect(filteredItems[0]).toEqual(linklessItem);
    expect(filteredItems[1].label).toBe("Section");
    expect(filteredItems[2].label).toBe("Group");
  });
});

/*

Simple:
  item 1
  item 2  x

Nested:
  item 1
    1.1
    1.2   x

  item 2  x
    2.1   x

 */
