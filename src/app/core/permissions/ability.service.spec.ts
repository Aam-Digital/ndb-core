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
import { EntityRule } from "./permission-types";
import { LoginState } from "../session/session-states/login-state.enum";
import { Permission } from "./permission";
import { PermissionEnforcerService } from "./permission-enforcer.service";
import { DatabaseUser } from "../session/session-service/local-user";
import { User } from "../user/user";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";
import { EntityAbility } from "./entity-ability";
import { ConfigurableEnumModule } from "../configurable-enum/configurable-enum.module";

describe("AbilityService", () => {
  let service: AbilityService;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let ability: EntityAbility;
  let mockSyncState: Subject<SyncState>;
  let mockLoginState: Subject<LoginState>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockPermissionEnforcer: jasmine.SpyObj<PermissionEnforcerService>;
  let user: DatabaseUser = { name: "testUser", roles: ["user_app"] };

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["load"]);
    mockEntityMapper.load.and.callFake(() =>
      Promise.resolve(getRawRules() as any)
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
      Permission,
      Permission.PERMISSION_KEY
    );
  });

  it("should retry fetching the rules after the sync has completed", () => {
    mockEntityMapper.load.and.returnValues(
      Promise.reject("first error"),
      Promise.resolve(getRawRules())
    );

    mockLoginState.next(LoginState.LOGGED_IN);

    expect(mockEntityMapper.load).toHaveBeenCalledTimes(1);

    mockSyncState.next(SyncState.COMPLETED);

    expect(mockEntityMapper.load).toHaveBeenCalledTimes(2);
  });

  it("should update the ability with the received rules for the logged in user", fakeAsync(() => {
    spyOn(ability, "update");

    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    expect(ability.update).toHaveBeenCalledWith(getParsedRules().user_app);
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
      getParsedRules().user_app.concat(getParsedRules().admin_app)
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
    service.abilityUpdateNotifier.subscribe(() => {
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
      new Permission({
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
      new Permission({
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

  function getRawRules(): Permission {
    return new Permission({
      user_app: [
        { subject: "Child", action: "read" },
        { subject: "Note", action: "manage", inverted: true },
      ],
      admin_app: [{ subject: "all", action: "manage" }],
    });
  }

  function getParsedRules(): { [key in string]: EntityRule[] } {
    return {
      user_app: [
        { subject: Child, action: "read" },
        { subject: Note, action: "manage", inverted: true },
      ],
      admin_app: [{ subject: "all", action: "manage" }],
    };
  }
});
