import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseRule } from "./permission-types";
import { SessionService } from "../session/session-service/session.service";
import { TEST_USER } from "../session/mock-session.module";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Database } from "../database/database";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { AbilityService } from "./ability.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { SyncedSessionService } from "../session/session-service/synced-session.service";
import { mockEntityMapper } from "../entity/mock-entity-mapper-service";
import { LOCATION_TOKEN } from "../../utils/di-tokens";
import { AnalyticsService } from "../analytics/analytics.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { BehaviorSubject, Subject } from "rxjs";
import { LoginState } from "../session/session-states/login-state.enum";
import { Permission } from "./permission";
import { EntityAbility } from "./entity-ability";

describe("PermissionEnforcerService", () => {
  let service: PermissionEnforcerService;
  let mockSession: jasmine.SpyObj<SyncedSessionService>;
  const userRules: DatabaseRule[] = [
    { subject: "all", action: "manage" },
    { subject: "Child", action: "read", inverted: true },
  ];
  let mockDatabase: jasmine.SpyObj<Database>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockAnalytics: jasmine.SpyObj<AnalyticsService>;
  const mockLoginState = new BehaviorSubject(LoginState.LOGGED_IN);
  let loadSpy: jasmine.Spy<EntityMapperService["load"]>;

  beforeEach(fakeAsync(() => {
    mockSession = jasmine.createSpyObj(["getCurrentUser"], {
      loginState: mockLoginState,
      syncState: new Subject(),
    });
    mockSession.getCurrentUser.and.returnValue({
      name: TEST_USER,
      roles: ["user_app"],
    });
    mockDatabase = jasmine.createSpyObj(["destroy"]);
    mockLocation = jasmine.createSpyObj(["reload"]);
    mockAnalytics = jasmine.createSpyObj(["eventTrack"]);

    TestBed.configureTestingModule({
      providers: [
        PermissionEnforcerService,
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        DynamicEntityService,
        EntitySchemaService,
        EntityAbility,
        { provide: Database, useValue: mockDatabase },
        { provide: SessionService, useValue: mockSession },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: AnalyticsService, useValue: mockAnalytics },
        AbilityService,
      ],
    });
    service = TestBed.inject(PermissionEnforcerService);
    TestBed.inject(AbilityService);
    loadSpy = spyOn(TestBed.inject(EntityMapperService), "load");
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

  it("should reset page if entity with write restriction exists (inverted)", fakeAsync(() => {
    TestBed.inject(EntityMapperService).save(new Child());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should reset page if entity with without read permission exists (non-inverted)", fakeAsync(() => {
    TestBed.inject(EntityMapperService).save(new Child());
    tick();

    updateRulesAndTriggerEnforcer([{ subject: "School", action: "manage" }]);
    tick();

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should reset page if entity exists for which relevant rule is a read restriction ", fakeAsync(() => {
    TestBed.inject(EntityMapperService).save(new Child());
    tick();

    updateRulesAndTriggerEnforcer([
      { subject: "all", action: "manage" },
      {
        subject: ["Child", "School"],
        action: ["read", "update"],
        inverted: true,
      },
      { subject: "Note", action: "create", inverted: true },
    ]);
    tick();

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should not reset page if only entities with read permission exist", fakeAsync(() => {
    TestBed.inject(EntityMapperService).save(new Child());
    TestBed.inject(EntityMapperService).save(new School());
    tick();

    updateRulesAndTriggerEnforcer([
      { subject: "School", action: ["read", "update"] },
      { subject: "all", action: "delete", inverted: true },
      { subject: ["Note", "Child"], action: "read" },
    ]);
    tick();

    expect(mockDatabase.destroy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  }));

  it("should not reset if roles didnt change since last check", fakeAsync(() => {
    updateRulesAndTriggerEnforcer(userRules);
    tick();

    TestBed.inject(EntityMapperService).save(new Child());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(mockDatabase.destroy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  }));

  it("should reset if roles changed since last check and entities without permissions exist", fakeAsync(() => {
    TestBed.inject(EntityMapperService).save(new School());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(mockDatabase.destroy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();

    const extendedRules = userRules.concat({
      subject: "School",
      action: "manage",
      inverted: true,
    });

    updateRulesAndTriggerEnforcer(extendedRules);
    tick();

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should track a migration event in analytics service when destroying the local db", fakeAsync(() => {
    TestBed.inject(EntityMapperService).save(new Child());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(
      "destroying local db due to lost permissions",
      {
        category: "Migration",
      }
    );
  }));

  async function updateRulesAndTriggerEnforcer(rules: DatabaseRule[]) {
    const role = mockSession.getCurrentUser().roles[0];
    loadSpy.and.resolveTo(new Permission({ [role]: rules }));
    mockLoginState.next(LoginState.LOGGED_IN);
  }
});
