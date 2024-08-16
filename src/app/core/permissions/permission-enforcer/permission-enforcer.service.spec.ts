import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";

import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseRule } from "../permission-types";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Database } from "../../database/database";
import { AbilityService } from "../ability/ability.service";
import { AnalyticsService } from "../../analytics/analytics.service";
import { Subject } from "rxjs";
import { Config } from "../../config/config";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";

describe("PermissionEnforcerService", () => {
  let service: PermissionEnforcerService;
  const userRules: DatabaseRule[] = [
    { subject: "all", action: "manage" },
    { subject: TestEntity.ENTITY_TYPE, action: "read", inverted: true },
  ];
  let entityUpdates: Subject<UpdatedEntity<Config>>;
  let entityMapper: EntityMapperService;
  let mockLocation: jasmine.SpyObj<Location>;
  let destroySpy: jasmine.Spy;
  let trackSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    entityUpdates = new Subject();
    mockLocation = jasmine.createSpyObj(["reload"]);
    entityMapper = mockEntityMapper();

    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: EntityMapperService, useValue: entityMapper },
      ],
    });
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    service = TestBed.inject(PermissionEnforcerService);
    TestBed.inject(AbilityService).initializeRules();
    destroySpy = spyOn(TestBed.inject(Database), "destroy");
    trackSpy = spyOn(TestBed.inject(AnalyticsService), "eventTrack");
  }));

  afterEach(() => {
    window.localStorage.removeItem(
      TEST_USER + "-" + PermissionEnforcerService.LOCALSTORAGE_KEY,
    );
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should write the users relevant permissions to local storage", fakeAsync(() => {
    service.enforcePermissionsOnLocalData(userRules);
    tick();

    const storedRules = window.localStorage.getItem(
      TEST_USER + "-" + PermissionEnforcerService.LOCALSTORAGE_KEY,
    );
    expect(JSON.parse(storedRules)).toEqual(userRules);
  }));

  it("should reset page if entity with write restriction exists (inverted)", fakeAsync(() => {
    entityMapper.save(new TestEntity());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(destroySpy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should reset page if entity without read permission exists (non-inverted)", fakeAsync(() => {
    entityMapper.save(new TestEntity());
    tick();

    updateRulesAndTriggerEnforcer([{ subject: "School", action: "manage" }]);
    tick();

    expect(destroySpy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should reset page if entity exists for which relevant rule is a read restriction ", fakeAsync(() => {
    entityMapper.save(new TestEntity());
    tick();

    updateRulesAndTriggerEnforcer([
      { subject: "all", action: "manage" },
      {
        subject: [TestEntity.ENTITY_TYPE, "School"],
        action: ["read", "update"],
        inverted: true,
      },
      { subject: "Note", action: "create", inverted: true },
    ]);
    tick();

    expect(destroySpy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should not reset page if only entities with read permission exist", fakeAsync(() => {
    entityMapper.save(new TestEntity());
    entityMapper.save(new TestEntity());
    tick();

    updateRulesAndTriggerEnforcer([
      { subject: TestEntity.ENTITY_TYPE, action: ["read", "update"] },
      { subject: "all", action: "delete", inverted: true },
      { subject: ["Note"], action: "read" },
    ]);
    tick();

    expect(destroySpy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  }));

  it("should not reset if roles didnt change since last check", fakeAsync(() => {
    updateRulesAndTriggerEnforcer(userRules);
    tick();

    entityMapper.save(new TestEntity());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(destroySpy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  }));

  it("should reset if roles changed since last check and entities without permissions exist", fakeAsync(() => {
    const entityCurrentlyAccessible = createEntityOfType("School");
    entityMapper.save(entityCurrentlyAccessible);
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(destroySpy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();

    const extendedRules = userRules.concat({
      subject: entityCurrentlyAccessible.getType(),
      action: "manage",
      inverted: true,
    });

    updateRulesAndTriggerEnforcer(extendedRules);
    tick();

    expect(destroySpy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should reset if read rule with condition is added", fakeAsync(() => {
    entityMapper.save(TestEntity.create("permitted"));
    entityMapper.save(TestEntity.create("not-permitted"));

    updateRulesAndTriggerEnforcer([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "read",
        conditions: { name: "permitted" },
      },
    ]);
    tick();

    expect(destroySpy).toHaveBeenCalled();
    expect(mockLocation.reload).toHaveBeenCalled();
  }));

  it("should track a migration event in analytics service when destroying the local db", fakeAsync(() => {
    entityMapper.save(new TestEntity());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(trackSpy).toHaveBeenCalledWith(
      "destroying local db due to lost permissions",
      {
        category: "Migration",
      },
    );
  }));

  it("should not fail if a non-entity rule exists", fakeAsync(() => {
    const rules: DatabaseRule[] = [
      { subject: TestEntity.ENTITY_TYPE, action: "manage" },
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
    const config = new Config(Config.PERMISSION_KEY, { ["user_app"]: rules });
    entityUpdates.next({ entity: config, type: "update" });
  }
});
