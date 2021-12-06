import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseRule, DatabaseRules, EntityAbility } from "./permission-types";
import { SessionService } from "../session/session-service/session.service";
import { TEST_USER } from "../session/mock-session.module";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Database } from "../database/database";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { AbilityService, detectEntityType } from "./ability.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { Permission } from "./permission";
import { Subject } from "rxjs";
import { LoginState } from "../session/session-states/login-state.enum";
import { SyncedSessionService } from "../session/session-service/synced-session.service";
import { mockEntityMapper } from "../entity/mock-entity-mapper-service";
import { LOCATION_TOKEN } from "../../utils/di-tokens";
import { AnalyticsService } from "../analytics/analytics.service";

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
    mockSession = jasmine.createSpyObj(["getCurrentUser"], {
      loginState: new Subject(),
      syncState: new Subject(),
    });
    mockSession.getCurrentUser.and.returnValue({ name: TEST_USER, roles: [] });
    mockDatabase = jasmine.createSpyObj(["destroy"]);
    mockLocation = jasmine.createSpyObj(["reload"]);
    mockAnalytics = jasmine.createSpyObj(["eventTrack"]);

    TestBed.configureTestingModule({
      providers: [
        PermissionEnforcerService,
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        EntitySchemaService,
        DynamicEntityService,
        AbilityService,
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
    const dbRules: DatabaseRules = {};
    dbRules[TEST_USER] = userRules;
    TestBed.inject(EntityMapperService).save(new Permission(dbRules));
    tick();
    TestBed.inject(AbilityService);
    mockSession.loginState.next(LoginState.LOGGED_IN);
    service = TestBed.inject(PermissionEnforcerService);
    tick();
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

  it("should reset page when no permissions were previously defined and entities without permissions exist", async () => {
    await TestBed.inject(EntityMapperService).save(new Child());

    await service.enforcePermissionsOnLocalData(userRules);

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
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
