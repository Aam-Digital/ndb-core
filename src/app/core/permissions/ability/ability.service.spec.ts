import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { AbilityService } from "./ability.service";
import { Subject } from "rxjs";
import { SessionService } from "../../session/session-service/session.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { Note } from "../../../child-dev-project/notes/model/note";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { User } from "../../user/user";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { EntityAbility } from "./entity-ability";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { Config } from "../../config/config";
import { LoggingService } from "../../logging/logging.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { AuthUser } from "../../session/session-service/auth-user";

describe("AbilityService", () => {
  let service: AbilityService;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let ability: EntityAbility;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let entityUpdates: Subject<UpdatedEntity<Config<DatabaseRules>>>;
  let mockPermissionEnforcer: jasmine.SpyObj<PermissionEnforcerService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  const user: AuthUser = { name: "testUser", roles: ["user_app"] };
  const rules: DatabaseRules = {
    user_app: [
      { subject: "Child", action: "read" },
      { subject: "Note", action: "manage", inverted: true },
    ],
    admin_app: [{ subject: "all", action: "manage" }],
  };

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["load", "receiveUpdates"]);
    mockEntityMapper.load.and.rejectWith();
    entityUpdates = new Subject();
    mockEntityMapper.receiveUpdates.and.returnValue(entityUpdates);
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(user);
    mockPermissionEnforcer = jasmine.createSpyObj([
      "enforcePermissionsOnLocalData",
    ]);
    mockLoggingService = jasmine.createSpyObj(["warn"]);

    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        {
          provide: PermissionEnforcerService,
          useValue: mockPermissionEnforcer,
        },
        { provide: LoggingService, useValue: mockLoggingService },
      ],
    });
    service = TestBed.inject(AbilityService);
    ability = TestBed.inject(EntityAbility);
  });

  afterEach(() => {
    entityUpdates.complete();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fetch the rules object from the database", () => {
    expect(mockEntityMapper.load).toHaveBeenCalledWith(
      Config,
      Config.PERMISSION_KEY
    );
  });

  it("should update the rules when a change is published", () => {
    mockEntityMapper.load.and.rejectWith("no initial config");

    expect(mockEntityMapper.load).toHaveBeenCalled();
    // Default rule
    expect(ability.rules).toEqual([{ action: "manage", subject: "all" }]);

    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(ability.rules).toEqual(rules[user.roles[0]]);
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
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });

    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(ability.update).toHaveBeenCalledWith(
      rules.user_app.concat(rules.admin_app)
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

    mockSessionService.getCurrentUser.and.returnValue({
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
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(
      mockPermissionEnforcer.enforcePermissionsOnLocalData
    ).toHaveBeenCalled();
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
    userEntity.name = user.name;
    expect(ability.can("manage", userEntity)).toBeTrue();
    const anotherUser = new User();
    anotherUser.name = "another user";
    expect(ability.cannot("manage", anotherUser)).toBeTrue();
  });

  it("should allow to check conditions with complex data types", fakeAsync(() => {
    const classInteraction = defaultInteractionTypes.find(
      (type) => type.id === "SCHOOL_CLASS"
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
    mockSessionService.getCurrentUser.and.returnValue({
      name: "new-user",
      roles: ["invalid_role"],
    });
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    expect(mockLoggingService.warn).toHaveBeenCalled();
  });

  it("should prepend default rules to all users", () => {
    const defaultRules: DatabaseRule[] = [
      { subject: "Config", action: "read" },
      { subject: "ProgressDashboardConfig", action: "manage" },
    ];
    const config = new Config<DatabaseRules>(
      Config.PERMISSION_KEY,
      Object.assign({ default: defaultRules } as DatabaseRules, rules)
    );

    entityUpdates.next({ entity: config, type: "update" });

    expect(ability.rules).toEqual(defaultRules.concat(...rules.user_app));

    mockSessionService.getCurrentUser.and.returnValue({
      name: "admin",
      roles: ["user_app", "admin_app"],
    });

    config._rev = "update";
    entityUpdates.next({ entity: config, type: "update" });
    expect(ability.rules).toEqual(
      defaultRules.concat(...rules.user_app, ...rules.admin_app)
    );
  });
});
