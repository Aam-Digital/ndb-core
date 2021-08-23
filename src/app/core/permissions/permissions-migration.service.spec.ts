import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PermissionsMigrationService } from "./permissions-migration.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "../config/config";
import { ConfigService } from "../config/config.service";

describe("PermissionsMigrationService", () => {
  let service: PermissionsMigrationService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["load", "save"]);
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    });
    service = TestBed.inject(PermissionsMigrationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should update view configurations", fakeAsync(() => {
    const oldConfig = {
      "view:user": {
        component: "UserAccount",
      },
      "view:users": {
        component: "UserList",
        requiresAdmin: true,
      },
      "view:admin/conflicts": {
        component: "ConflictResolution",
        requiresAdmin: true,
        lazyLoaded: true,
        config: { someConfig: true },
      },
      "entity:Note": {
        permissions: {},
      },
    };
    mockEntityMapper.load.and.resolveTo(new Config(oldConfig));
    const saveConfigSpy = spyOn(TestBed.inject(ConfigService), "saveConfig");

    service.migrateRoutePermissions();
    tick();

    expect(saveConfigSpy).toHaveBeenCalledWith(mockEntityMapper, {
      "view:user": {
        component: "UserAccount",
      },
      "view:users": {
        component: "UserList",
        permittedUserRoles: ["admin_app"],
      },
      "view:admin/conflicts": {
        component: "ConflictResolution",
        permittedUserRoles: ["admin_app"],
        lazyLoaded: true,
        config: { someConfig: true },
      },
      "entity:Note": {
        permissions: {},
      },
    });
  }));
});
