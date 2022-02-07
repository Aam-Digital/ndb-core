import { fakeAsync, TestBed } from "@angular/core/testing";

import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseRule, EntityAbility } from "./permission-types";
import { SessionService } from "../session/session-service/session.service";
import { TEST_USER } from "../session/mock-session.module";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Database } from "../database/database";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { detectEntityType } from "./ability.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { SyncedSessionService } from "../session/session-service/synced-session.service";
import { mockEntityMapper } from "../entity/mock-entity-mapper-service";
import { LOCATION_TOKEN } from "../../utils/di-tokens";
import { AnalyticsService } from "../analytics/analytics.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";

describe("PermissionEnforcerService", () => {
  let service: PermissionEnforcerService;
  let mockSession: jasmine.SpyObj<SyncedSessionService>;
  const userRules: DatabaseRule[] = [
    { subject: "any", action: "manage" },
    { subject: "Child", action: "read", inverted: true },
  ];
  let mockDatabase: jasmine.SpyObj<Database>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockAnalytics: jasmine.SpyObj<AnalyticsService>;

  beforeEach(fakeAsync(() => {
    mockSession = jasmine.createSpyObj(["getCurrentUser"]);
    mockSession.getCurrentUser.and.returnValue({ name: TEST_USER, roles: [] });
    mockDatabase = jasmine.createSpyObj(["destroy"]);
    mockLocation = jasmine.createSpyObj(["reload"]);
    mockAnalytics = jasmine.createSpyObj(["eventTrack"]);

    TestBed.configureTestingModule({
      providers: [
        PermissionEnforcerService,
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        DynamicEntityService,
        EntitySchemaService,
        {
          provide: EntityAbility,
          useValue: new EntityAbility([], {
            detectSubjectType: detectEntityType,
          }),
        },
        { provide: Database, useValue: mockDatabase },
        { provide: SessionService, useValue: mockSession },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: AnalyticsService, useValue: mockAnalytics },
      ],
    });
    service = TestBed.inject(PermissionEnforcerService);
  }));

  afterEach(async () => {
    window.localStorage.removeItem(
      TEST_USER + "-" + PermissionEnforcerService.STORAGE_KEY
    );
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should write the users relevant permissions to local storage", async () => {
    await service.enforcePermissionsOnLocalData(userRules);

    const storedRules = window.localStorage.getItem(
      TEST_USER + "-" + PermissionEnforcerService.STORAGE_KEY
    );
    expect(JSON.parse(storedRules)).toEqual(userRules);
  });

  it("should reset page if entity with write restriction exists (inverted)", async () => {
    await TestBed.inject(EntityMapperService).save(new Child());

    await service.enforcePermissionsOnLocalData(userRules);

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("should reset page if entity with without read permission exists (non-inverted)", async () => {
    await TestBed.inject(EntityMapperService).save(new Child());

    await service.enforcePermissionsOnLocalData([
      { subject: "School", action: "manage" },
    ]);

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("should reset page if entity exists for which relevant rule is a read restriction ", async () => {
    await TestBed.inject(EntityMapperService).save(new Child());

    await service.enforcePermissionsOnLocalData([
      { subject: "any", action: "manage" },
      {
        subject: ["Child", "School"],
        action: ["read", "update"],
        inverted: true,
      },
      { subject: "Note", action: "create", inverted: true },
    ]);

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("should not reset page if only entities with read permission exist", async () => {
    await TestBed.inject(EntityMapperService).save(new Child());
    await TestBed.inject(EntityMapperService).save(new School());

    await service.enforcePermissionsOnLocalData([
      { subject: "School", action: ["read", "update"] },
      { subject: "any", action: "delete", inverted: true },
      { subject: ["Note", "Child"], action: "read" },
    ]);

    expect(mockDatabase.destroy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  });

  it("should not reset if roles didnt change since last check", async () => {
    await service.enforcePermissionsOnLocalData(userRules);

    await TestBed.inject(EntityMapperService).save(new Child());

    await service.enforcePermissionsOnLocalData(userRules);

    expect(mockDatabase.destroy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  });

  it("should reset if roles changed since last check and entities without permissions exist", async () => {
    await TestBed.inject(EntityMapperService).save(new School());

    await service.enforcePermissionsOnLocalData(userRules);

    expect(mockDatabase.destroy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();

    const extendedRules = userRules.concat({
      subject: "School",
      action: "manage",
      inverted: true,
    });

    await service.enforcePermissionsOnLocalData(extendedRules);

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("should track a migration event in analytics service when destroying the local db", async () => {
    await TestBed.inject(EntityMapperService).save(new Child());

    await service.enforcePermissionsOnLocalData(userRules);

    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(
      "destroying local db due to lost permissions",
      {
        category: "Migration",
      }
    );
  });
});
