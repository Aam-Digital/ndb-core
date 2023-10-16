import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";

import { AbilityService } from "./ability.service";
import { Subject } from "rxjs";
import { Child } from "../../../child-dev-project/children/model/child";
import { Note } from "../../../child-dev-project/notes/model/note";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { CurrentUserSubject, User } from "../../user/user";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { EntityAbility } from "./entity-ability";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { Config } from "../../config/config";
import { LoggingService } from "../../logging/logging.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { TEST_USER } from "../../../utils/mock-local-session";

describe("AbilityService", () => {
  let service: AbilityService;
  let ability: EntityAbility;
  let entityUpdates: Subject<UpdatedEntity<Config<DatabaseRules>>>;
  let entityMapper: jasmine.SpyObj<EntityMapperService>;
  const rules: DatabaseRules = {
    user_app: [
      { subject: "Child", action: "read" },
      { subject: "Note", action: "manage", inverted: true },
    ],
    admin_app: [{ subject: "all", action: "manage" }],
  };

  beforeEach(waitForAsync(() => {
    entityUpdates = new Subject();
    entityMapper = mockEntityMapper() as any;
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    spyOn(entityMapper, "load").and.callThrough();
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });
    service = TestBed.inject(AbilityService);
    ability = TestBed.inject(EntityAbility);
  }));

  afterEach(() => {
    entityUpdates.complete();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fetch the rules object from the database", () => {
    expect(entityMapper.load).toHaveBeenCalledWith(
      Config,
      Config.PERMISSION_KEY,
    );
  });

  it("should update the rules when a change is published", () => {
    entityMapper.load.and.rejectWith("no initial config");

    expect(entityMapper.load).toHaveBeenCalled();
    // Default rule
    expect(ability.rules).toEqual([{ action: "manage", subject: "all" }]);

    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(ability.rules).toEqual(rules["user_app"]);
  });

  it("should update the ability with the received rules for the logged in user", () => {
    spyOn(ability, "update");
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(ability.update).toHaveBeenCalledWith(rules.user_app);
  });

  it("should update the ability with rules for all roles the logged in user has", () => {
    spyOn(ability, "update");
    TestBed.inject(CurrentUserSubject).next({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });

    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(ability.update).toHaveBeenCalledWith(
      rules.user_app.concat(rules.admin_app),
    );
  });

  it("should create an ability that correctly uses the defined rules", () => {
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(ability.can("read", Child)).toBeTrue();
    expect(ability.can("create", Child)).toBeFalse();
    expect(ability.can("manage", Child)).toBeFalse();
    expect(ability.can("read", new Child())).toBeTrue();
    expect(ability.can("create", new Child())).toBeFalse();
    expect(ability.can("manage", Note)).toBeFalse();
    expect(ability.can("manage", new Note())).toBeFalse();
    expect(ability.can("create", new Note())).toBeFalse();

    TestBed.inject(CurrentUserSubject).next({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });

    const updatedConfig = new Config(Config.PERMISSION_KEY, rules);
    updatedConfig._rev = "update";
    entityUpdates.next({ entity: updatedConfig, type: "update" });

    expect(ability.can("manage", Child)).toBeTrue();
    expect(ability.can("manage", new Child())).toBeTrue();
    expect(ability.can("manage", Note)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();
  });

  it("should throw an error when checking permissions on a object that is not a Entity", () => {
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    class TestClass {}

    expect(() => ability.can("read", new TestClass() as any)).toThrowError();
  });

  it("should give all permissions if no rules object can be fetched", () => {
    // Request failed, sync not started - offline without cached rules object
    expect(ability.can("read", Child)).toBeTrue();
    expect(ability.can("update", Child)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();
  });

  it("should notify when the rules are updated", (done) => {
    spyOn(ability, "update");
    service.abilityUpdated.subscribe(() => {
      expect(ability.update).toHaveBeenCalled();
      done();
    });

    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });
  });

  it("should call the ability enforcer after updating the rules", () => {
    const enforceSpy = spyOn(
      TestBed.inject(PermissionEnforcerService),
      "enforcePermissionsOnLocalData",
    );
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(enforceSpy).toHaveBeenCalled();
  });

  it("should allow to access user properties in the rules", () => {
    const config = new Config<DatabaseRules>(Config.PERMISSION_KEY, {
      user_app: [
        {
          subject: "User",
          action: "manage",
          conditions: { name: "${user.name}" },
        },
      ],
    });
    entityUpdates.next({ entity: config, type: "update" });

    const userEntity = new User();
    userEntity.name = TEST_USER;
    expect(ability.can("manage", userEntity)).toBeTrue();
    const anotherUser = new User();
    anotherUser.name = "another user";
    expect(ability.cannot("manage", anotherUser)).toBeTrue();
  });

  it("should allow to check conditions with complex data types", fakeAsync(() => {
    const classInteraction = defaultInteractionTypes.find(
      (type) => type.id === "SCHOOL_CLASS",
    );
    const config = new Config<DatabaseRules>(Config.PERMISSION_KEY, {
      user_app: [
        {
          subject: "Note",
          action: "read",
          conditions: { category: classInteraction.id },
        },
      ],
    });
    entityUpdates.next({ entity: config, type: "update" });

    const note = new Note();
    expect(ability.can("read", note)).toBeFalse();
    note.category = classInteraction;
    tick();
    expect(ability.can("read", note)).toBeTrue();
  }));

  it("should log a warning if no rules are found for a user", () => {
    TestBed.inject(CurrentUserSubject).next({
      name: "new-user",
      roles: ["invalid_role"],
    });
    const warnSpy = spyOn(TestBed.inject(LoggingService), "warn");
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(warnSpy).toHaveBeenCalled();
  });

  it("should prepend default rules to all users", () => {
    const defaultRules: DatabaseRule[] = [
      { subject: "Config", action: "read" },
      { subject: "ProgressDashboardConfig", action: "manage" },
    ];
    const config = new Config<DatabaseRules>(
      Config.PERMISSION_KEY,
      Object.assign({ default: defaultRules } as DatabaseRules, rules),
    );

    entityUpdates.next({ entity: config, type: "update" });

    expect(ability.rules).toEqual(defaultRules.concat(...rules.user_app));

    TestBed.inject(CurrentUserSubject).next({
      name: "admin",
      roles: ["user_app", "admin_app"],
    });

    config._rev = "update";
    entityUpdates.next({ entity: config, type: "update" });
    expect(ability.rules).toEqual(
      defaultRules.concat(...rules.user_app, ...rules.admin_app),
    );
  });
});
