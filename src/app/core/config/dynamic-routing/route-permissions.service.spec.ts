import { TestBed } from "@angular/core/testing";

import { RoutePermissionsService } from "./route-permissions.service";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../permissions/permission-guard/entity-permission.guard";

describe("RoutePermissionsService", () => {
  let service: RoutePermissionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: UserRoleGuard, useValue: {} },
        { provide: EntityPermissionGuard, useValue: {} },
      ],
    });
    service = TestBed.inject(RoutePermissionsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
