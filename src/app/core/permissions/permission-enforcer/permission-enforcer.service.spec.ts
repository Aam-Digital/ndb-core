import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";

import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseRule } from "../permission-types";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { AbilityService } from "../ability/ability.service";
import { AnalyticsService } from "../../analytics/analytics.service";
import { Subject } from "rxjs";
import { Config } from "../../config/config";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { MockEntityMapperService } from "../../entity/entity-mapper/mock-entity-mapper-service";

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
  let resetSyncSpy: jasmine.Spy;
  let purgeLocalDocSpy: jasmine.Spy;
  let isIndexedDbAdapterSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    entityUpdates = new Subject();
    mockLocation = jasmine.createSpyObj(["reload"]);

    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [{ provide: LOCATION_TOKEN, useValue: mockLocation }],
    });
    service = TestBed.inject(PermissionEnforcerService);

    entityMapper = TestBed.inject(EntityMapperService);
    (entityMapper as MockEntityMapperService).clearAllData();
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);

    const dbResolver = TestBed.inject(DatabaseResolverService);
    dbResolver.destroyDatabases = () => null;
    destroySpy = spyOn(dbResolver, "destroyDatabases");
    dbResolver.resetSync = () => Promise.resolve();
    resetSyncSpy = spyOn(dbResolver, "resetSync").and.resolveTo();
    dbResolver.purgeLocalDoc = () => Promise.resolve(true);
    purgeLocalDocSpy = spyOn(dbResolver, "purgeLocalDoc").and.resolveTo(true);
    // Default to indexeddb adapter for tests unless overridden
    dbResolver.isIndexedDbAdapterSupported = () => true;
    isIndexedDbAdapterSpy = spyOn(
      dbResolver,
      "isIndexedDbAdapterSupported",
    ).and.returnValue(true);

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

  it("should write the users relevant permissions to local storage", fakeAsync(() => {
    service.enforcePermissionsOnLocalData(userRules);
    tick();

    const storedRules = window.localStorage.getItem(
      TEST_USER + "-" + PermissionEnforcerService.LOCALSTORAGE_KEY,
    );
    expect(JSON.parse(storedRules)).toEqual(userRules);
  }));

  it("should not reset if roles didnt change since last check", fakeAsync(() => {
    updateRulesAndTriggerEnforcer(userRules);
    tick();
    resetSyncSpy.calls.reset();

    entityMapper.save(new TestEntity());
    tick();

    updateRulesAndTriggerEnforcer(userRules);
    tick();

    expect(destroySpy).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
    expect(resetSyncSpy).not.toHaveBeenCalled();
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

  describe("indexeddb adapter (purge supported)", () => {
    // isIndexedDbAdapterSpy defaults to true from beforeEach

    it("should purge inaccessible entities before and after resetSync (to handle push/pull race)", fakeAsync(() => {
      const inaccessible = new TestEntity();
      entityMapper.save(inaccessible);
      tick();

      // Track call order via a shared sequence log
      const callSequence: string[] = [];
      purgeLocalDocSpy.and.callFake(() => {
        callSequence.push("purge");
        return Promise.resolve(true);
      });
      resetSyncSpy.and.callFake(() => {
        callSequence.push("sync");
        return Promise.resolve();
      });

      updateRulesAndTriggerEnforcer(userRules);
      tick();

      expect(purgeLocalDocSpy).toHaveBeenCalledWith(inaccessible.getId());
      expect(destroySpy).not.toHaveBeenCalled();
      expect(mockLocation.reload).not.toHaveBeenCalled();

      // Verify the double-purge pattern: purge → sync → purge (at least once in sequence)
      const firstPurgeIdx = callSequence.indexOf("purge");
      const firstSyncIdx = callSequence.indexOf("sync");
      const lastPurgeIdx = callSequence.lastIndexOf("purge");
      expect(firstPurgeIdx).toBeLessThan(firstSyncIdx);
      expect(lastPurgeIdx).toBeGreaterThan(firstSyncIdx);
    }));

    it("should call resetSync even when no entities lack permissions", fakeAsync(() => {
      updateRulesAndTriggerEnforcer([{ subject: "all", action: "manage" }]);
      tick();

      expect(resetSyncSpy).toHaveBeenCalled();
      expect(purgeLocalDocSpy).not.toHaveBeenCalled();
      expect(destroySpy).not.toHaveBeenCalled();
      expect(mockLocation.reload).not.toHaveBeenCalled();
    }));

    it("should track analytics event 're-sync triggered due to changed permissions' when rules change", fakeAsync(() => {
      const trackSpy = spyOn(TestBed.inject(AnalyticsService), "eventTrack");

      entityMapper.save(new TestEntity());
      tick();

      updateRulesAndTriggerEnforcer(userRules);
      tick();

      expect(trackSpy).toHaveBeenCalledWith(
        "re-sync triggered due to changed permissions",
        { category: "Migration" },
      );
    }));
  });

  describe("legacy idb adapter (purge not supported)", () => {
    beforeEach(() => {
      isIndexedDbAdapterSpy.and.returnValue(false);
    });

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

    it("should reset page if entity exists for which relevant rule is a read restriction", fakeAsync(() => {
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
      destroySpy.calls.reset();
      mockLocation.reload.calls.reset();

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

    it("should destroy and reload when roles changed and entities without permissions now exist", fakeAsync(() => {
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

    it("should track analytics event 'destroying local db due to lost permissions' when destroying the local db", fakeAsync(() => {
      const trackSpy = spyOn(TestBed.inject(AnalyticsService), "eventTrack");

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

    it("should call resetSync if rules changed but no entities lack permissions", fakeAsync(() => {
      // No entities saved, so no permission violations
      updateRulesAndTriggerEnforcer([{ subject: "all", action: "manage" }]);
      tick();

      expect(destroySpy).not.toHaveBeenCalled();
      expect(mockLocation.reload).not.toHaveBeenCalled();
      expect(resetSyncSpy).toHaveBeenCalled();
    }));
  });

  function updateRulesAndTriggerEnforcer(rules: DatabaseRule[]) {
    const config = new Config(Config.PERMISSION_KEY, { ["user_app"]: rules });
    entityUpdates.next({ entity: config, type: "update" });
  }
});
