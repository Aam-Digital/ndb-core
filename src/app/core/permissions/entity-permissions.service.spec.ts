import { TestBed } from "@angular/core/testing";

import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { SessionService } from "../session/session-service/session.service";
import { User } from "../user/user";
import { Entity } from "../entity/model/entity";
import { EntityConfigService } from "../entity/entity-config.service";

describe("EntityPermissionsService", () => {
  let service: EntityPermissionsService;
  const mockConfigService: jasmine.SpyObj<EntityConfigService> =
    jasmine.createSpyObj(["getEntityConfig"]);
  const mockSessionService: jasmine.SpyObj<SessionService> =
    jasmine.createSpyObj(["getCurrentUser"]);
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityConfigService, useValue: mockConfigService },
        { provide: SessionService, useValue: mockSessionService },
      ],
    });
    service = TestBed.inject(EntityPermissionsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should give permission if nothing is defined", () => {
    mockConfigService.getEntityConfig.and.returnValue(null);
    const permitted = service.userIsPermitted(Entity, OperationType.CREATE);
    expect(permitted).toBeTrue();
  });

  it("should give permission if operation is not defined", () => {
    mockConfigService.getEntityConfig.and.returnValue({
      permissions: { update: ["admin"] },
    });
    const permitted = service.userIsPermitted(Entity, OperationType.CREATE);
    expect(permitted).toBeTrue();
  });

  it("should not give user create permission when only admin is specified", () => {
    const noAdmin = new User();
    noAdmin.setAdmin(false);
    mockSessionService.getCurrentUser.and.returnValue(noAdmin);
    mockConfigService.getEntityConfig.and.returnValue({
      permissions: { create: ["admin"] },
    });
    const permitted = service.userIsPermitted(Entity, OperationType.CREATE);
    expect(permitted).toBeFalse();
  });

  it("should give admin create permission when admin is specified", () => {
    const admin = new User();
    admin.setAdmin(true);
    mockSessionService.getCurrentUser.and.returnValue(admin);
    mockConfigService.getEntityConfig.and.returnValue({
      permissions: { create: ["admin"] },
    });
    const permitted = service.userIsPermitted(Entity, OperationType.CREATE);
    expect(permitted).toBeTrue();
  });
});
