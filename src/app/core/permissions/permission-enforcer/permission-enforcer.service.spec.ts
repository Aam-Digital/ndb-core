import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { SessionService } from "../../session/session-service/session.service";
import { TEST_USER } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Database } from "../../database/database";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { AbilityService } from "../ability/ability.service";
import { SyncedSessionService } from "../../session/session-service/synced-session.service";
import { mockEntityMapper } from "../../entity/mock-entity-mapper-service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { AnalyticsService } from "../../analytics/analytics.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { of, Subject } from "rxjs";
import { EntityAbility } from "../ability/entity-ability";
import { Config } from "../../config/config";
import {
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { ConfigService } from "../../config/config.service";

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
  let entityMapper: EntityMapperService;
  const entityUpdates = new Subject<UpdatedEntity<Config<DatabaseRules>>>();

  beforeEach(fakeAsync(() => {
    mockSession = jasmine.createSpyObj(["getCurrentUser"]);
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
        EntitySchemaService,
        EntityAbility,
        { provide: Database, useValue: mockDatabase },
        { provide: SessionService, useValue: mockSession },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: EntityRegistry, useValue: entityRegistry },
        AbilityService,
        {
          provide: ConfigService,
          useValue: { configUpdates: of(new Config()) },
        },
      ],
    });
    entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    service = TestBed.inject(PermissionEnforcerService);
    TestBed.inject(AbilityService).initializeRules();
  }));

  afterEach(() => {
    window.localStorage.removeItem(
      TEST_USER + "-" + PermissionEnforcerService.LOCALSTORAGE_KEY,
    );
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should write the users relevant permissions to local storage", async () => {
    await service.enforcePermissionsOnLocalData(userRules);

    const storedRules = window.localStorage.getItem(
      TEST_USER + "-" + PermissionEnforcerService.LOCALSTORAGE_KEY,
    );
    expect(JSON.parse(storedRules)).toEqual(userRules);
  });

  it("should reset page if entity with write restriction exists (inverted)", fakeAsync(() => {
    entityMapper.save(new Child());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should reset page if entity without read permission exists (non-inverted)", fakeAsync(() => {
    entityMapper.save(new Child());
    tick();

    updateRulesAndTriggerEnforcer([{ subject: "School", action: "manage" }]);
    tick();

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should reset page if entity exists for which relevant rule is a read restriction ", fakeAsync(() => {
    entityMapper.save(new Child());
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
    entityMapper.save(new Child());
    entityMapper.save(new School());
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

    entityMapper.save(new Child());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(mockDatabase.destroy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  }));

  it("should reset if roles changed since last check and entities without permissions exist", fakeAsync(() => {
    entityMapper.save(new School());
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

  it("should reset if read rule with condition is added", fakeAsync(() => {
    entityMapper.save(Child.create("permitted"));
    entityMapper.save(Child.create("not-permitted"));

    updateRulesAndTriggerEnforcer([
      { subject: "Child", action: "read", conditions: { name: "permitted" } },
    ]);
    tick();

    expect(mockDatabase.destroy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should track a migration event in analytics service when destroying the local db", fakeAsync(() => {
    entityMapper.save(new Child());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(
      "destroying local db due to lost permissions",
      {
        category: "Migration",
      },
    );
  }));

  it("should not fail if a non-entity rule exists", fakeAsync(() => {
    const rules: DatabaseRule[] = [
      { subject: "Child", action: "manage" },
      { subject: "org.couchdb.user", action: "read", inverted: true },
    ];
    updateRulesAndTriggerEnforcer(rules);
    tick();

    const storedRules = localStorage.getItem(
      `${TEST_USER}-${PermissionEnforcerService.LOCALSTORAGE_KEY}`,
    );
    expect(JSON.parse(storedRules)).toEqual(rules);
  }));

  function updateRulesAndTriggerEnforcer(rules: DatabaseRule[]) {
    const role = mockSession.getCurrentUser().roles[0];
    const config = new Config(Config.PERMISSION_KEY, { [role]: rules });
    entityUpdates.next({ entity: config, type: "update" });
  }
});
