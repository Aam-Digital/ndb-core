import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { AbilityService } from "./ability.service";
import { Subject } from "rxjs";
import { SessionService } from "../session/session-service/session.service";
import { Child } from "../../child-dev-project/children/model/child";
import { Note } from "../../child-dev-project/notes/model/note";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { SyncState } from "../session/session-states/sync-state.enum";
import { LoginState } from "../session/session-states/login-state.enum";
import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseUser } from "../session/session-service/local-user";
import { User } from "../user/user";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";
import { EntityAbility } from "./entity-ability";
import { ConfigurableEnumModule } from "../configurable-enum/configurable-enum.module";
import { DatabaseRules } from "./permission-types";
import { Config } from "../config/config";
import { LoggingService } from "../logging/logging.service";

describe("AbilityService", () => {
  let service: AbilityService;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let ability: EntityAbility;
  let mockSyncState: Subject<SyncState>;
  let mockLoginState: Subject<LoginState>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockPermissionEnforcer: jasmine.SpyObj<PermissionEnforcerService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  const user: DatabaseUser = { name: "testUser", roles: ["user_app"] };
  const rules: DatabaseRules = {
    user_app: [
      { subject: "Child", action: "read" },
      { subject: "Note", action: "manage", inverted: true },
    ],
    admin_app: [{ subject: "all", action: "manage" }],
  };

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["load"]);
    mockEntityMapper.load.and.resolveTo(
      new Config(Config.PERMISSION_KEY, rules)
    );
    mockSyncState = new Subject<SyncState>();
    mockLoginState = new Subject<LoginState>();
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"], {
      syncState: mockSyncState,
      loginState: mockLoginState,
    });
    mockSessionService.getCurrentUser.and.returnValue(user);
    mockPermissionEnforcer = jasmine.createSpyObj([
      "enforcePermissionsOnLocalData",
    ]);
    mockLoggingService = jasmine.createSpyObj(["warn"]);

    TestBed.configureTestingModule({
      imports: [ConfigurableEnumModule],
      providers: [
        EntityAbility,
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        {
          provide: PermissionEnforcerService,
          useValue: mockPermissionEnforcer,
        },
        { provide: LoggingService, useValue: mockLoggingService },
        EntitySchemaService,
        DynamicEntityService,
        AbilityService,
      ],
    });
    service = TestBed.inject(AbilityService);
    ability = TestBed.inject(EntityAbility);
  });

  afterEach(() => {
    mockLoginState.complete();
    mockSyncState.complete();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fetch the rules object from the database", () => {
    mockLoginState.next(LoginState.LOGGED_IN);

    expect(mockEntityMapper.load).toHaveBeenCalledWith(
      Config,
      Config.PERMISSION_KEY
    );
  });

  it("should retry fetching the rules after the sync has completed", fakeAsync(() => {
    mockEntityMapper.load.and.returnValues(
      Promise.reject("first error"),
      Promise.resolve(new Config(Config.PERMISSION_KEY, rules))
    );
    const ability = TestBed.inject(EntityAbility);

    mockLoginState.next(LoginState.LOGGED_IN);

    expect(mockEntityMapper.load).toHaveBeenCalledTimes(1);
    // Default rule
    expect(ability.rules).toEqual([{ action: "manage", subject: "all" }]);

    mockSyncState.next(SyncState.COMPLETED);

    expect(mockEntityMapper.load).toHaveBeenCalledTimes(2);
    tick();
    expect(ability.rules).toEqual(rules[user.roles[0]]);
  }));

  it("should update the ability with the received rules for the logged in user", fakeAsync(() => {
    spyOn(ability, "update");

    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    expect(ability.update).toHaveBeenCalledWith(rules.user_app);
  }));

  it("should update the ability with rules for all roles the logged in user has", fakeAsync(() => {
    spyOn(ability, "update");
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });

    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    expect(ability.update).toHaveBeenCalledWith(
      rules.user_app.concat(rules.admin_app)
    );
  }));

  it("should create an ability that correctly uses the defined rules", fakeAsync(() => {
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

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
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    expect(ability.can("manage", Child)).toBeTrue();
    expect(ability.can("manage", new Child())).toBeTrue();
    expect(ability.can("manage", Note)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();
  }));

  it("should throw an error when checking permissions on a object that is not a Entity", () => {
    mockLoginState.next(LoginState.LOGGED_IN);

    class TestClass {}
    expect(() => ability.can("read", new TestClass() as any)).toThrowError();
  });

  it("should give all permissions if no rules object can be fetched", () => {
    mockEntityMapper.load.and.rejectWith();

    mockLoginState.next(LoginState.LOGGED_IN);

    // Request failed, sync not started - offline without cached rules object
    expect(ability.can("read", Child)).toBeTrue();
    expect(ability.can("update", Child)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();

    mockSyncState.next(SyncState.STARTED);

    // Request failed, sync started - no rules object exists
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

    mockLoginState.next(LoginState.LOGGED_IN);
  });

  it("should call the ability enforcer after updating the rules", fakeAsync(() => {
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    expect(
      mockPermissionEnforcer.enforcePermissionsOnLocalData
    ).toHaveBeenCalled();
  }));

  it("should allow to access user properties in the rules", fakeAsync(() => {
    mockEntityMapper.load.and.resolveTo(
      new Config(Config.PERMISSION_KEY, {
        user_app: [
          {
            subject: "User",
            action: "manage",
            conditions: { name: "${user.name}" },
          },
        ],
      })
    );
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    const userEntity = new User();
    userEntity.name = user.name;
    expect(ability.can("manage", userEntity)).toBeTrue();
    userEntity.name = "another user";
    expect(ability.cannot("manage", userEntity)).toBeTrue();
  }));

  it("should allow to check conditions with complex data types", fakeAsync(() => {
    const classInteraction = defaultInteractionTypes.find(
      (type) => type.id === "SCHOOL_CLASS"
    );
    mockEntityMapper.load.and.resolveTo(
      new Config(Config.PERMISSION_KEY, {
        user_app: [
          {
            subject: "Note",
            action: "read",
            conditions: { category: classInteraction.id },
          },
        ],
      })
    );
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    const note = new Note();
    expect(ability.can("read", note)).toBeFalse();
    note.category = classInteraction;
    expect(ability.can("read", note)).toBeTrue();
  }));

  it("should log a warning if no rules are found for a user", fakeAsync(() => {
    mockSessionService.getCurrentUser.and.returnValue({
      name: "new-user",
      roles: ["invalid_role"],
    });
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    expect(mockLoggingService.warn).toHaveBeenCalled();
  }));
});
