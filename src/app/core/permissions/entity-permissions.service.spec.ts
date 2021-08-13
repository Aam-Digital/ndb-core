import { TestBed } from "@angular/core/testing";

import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { SessionService } from "../session/session-service/session.service";
import { Entity } from "../entity/model/entity";
import { EntityConfigService } from "../entity/entity-config.service";

describe("EntityPermissionsService", () => {
  let service: EntityPermissionsService;
  let mockConfigService: jasmine.SpyObj<EntityConfigService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getEntityConfig"]);
    mockSessionService = jasmine.createSpyObj(["getCurrentDBUser"]);

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

  it("should not give permission if user does not have any required role", () => {
    mockSessionService.getCurrentDBUser.and.returnValue({
      name: "noAdminUser",
      roles: ["user_app"],
    });
    mockConfigService.getEntityConfig.and.returnValue({
      permissions: { create: ["admin_app"] },
    });

    const permitted = service.userIsPermitted(Entity, OperationType.CREATE);

    expect(permitted).toBeFalse();
  });

  it("should give permission when user has a required role", () => {
    mockSessionService.getCurrentDBUser.and.returnValue({
      name: "adminUser",
      roles: ["user_app", "admin_app"],
    });
    mockConfigService.getEntityConfig.and.returnValue({
      permissions: { create: ["admin_app"] },
    });

    const permitted = service.userIsPermitted(Entity, OperationType.CREATE);

    expect(permitted).toBeTrue();
  });
});
