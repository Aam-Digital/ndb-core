import { TestBed, waitForAsync } from "@angular/core/testing";

import { AbilityService } from "./ability.service";
import { BehaviorSubject, Subject } from "rxjs";
import { Note } from "../../../child-dev-project/notes/model/note";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { EntityAbility } from "./entity-ability";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { Config } from "../../config/config";
import { Logging } from "../../logging/logging.service";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { EventAttendanceMapDatatype } from "#src/app/features/attendance/deprecated/event-attendance-map.datatype";
import { SessionSubject } from "../../session/auth/session-info";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { CurrentUserSubject } from "../../session/current-user-subject";

describe("AbilityService", () => {
  let service: AbilityService;
  let ability: EntityAbility;
  let entityUpdates: Subject<UpdatedEntity<Config<DatabaseRules>>>;
  let entityMapper: any;
  const rules: DatabaseRules = {
    user_app: [
      { subject: TestEntity.ENTITY_TYPE, action: "read" },
      { subject: Note.ENTITY_TYPE, action: "manage", inverted: true },
    ],
    admin_app: [{ subject: "all", action: "manage" }],
  };

  beforeEach(waitForAsync(() => {
    entityUpdates = new Subject();
    entityMapper = {
      receiveUpdates: vi.fn(),
      load: vi.fn(),
      loadType: vi.fn(),
    };
    entityMapper.receiveUpdates.mockReturnValue(entityUpdates);
    entityMapper.loadType.mockResolvedValue([]);
    entityMapper.load.mockRejectedValue();

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        AbilityService,
        EntityAbility,
        {
          provide: SessionSubject,
          useValue: new BehaviorSubject({
            name: TEST_USER,
            roles: ["user_app"],
            entityId: TestEntity.createPrefixedId(
              TestEntity.ENTITY_TYPE,
              TEST_USER,
            ),
          }),
        },
        {
          provide: CurrentUserSubject,
          useValue: new BehaviorSubject(new TestEntity(TEST_USER)),
        },
        {
          provide: DefaultDatatype,
          useClass: EventAttendanceMapDatatype,
          multi: true,
        },
        {
          provide: PermissionEnforcerService,
          useValue: {
            enforcePermissionsOnLocalData: vi.fn(),
          },
        },
        { provide: EntityMapperService, useValue: entityMapper },
      ],
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
    service.initializeRules();
    expect(entityMapper.load).toHaveBeenCalledWith(
      Config,
      Config.PERMISSION_KEY,
    );
  });

  it("should give all permissions if no rules object can be fetched but not until checking for rules object", async () => {
    vi.useFakeTimers();
    try {
      entityMapper.load.mockRejectedValue("no initial config");

      // no permissions until rules object has been attempted to fetch initially
      expect(ability.rules).toEqual([]);

      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0); // initial attempt to load rules resolved now

      // Request failed, sync not started - offline without cached rules object
      expect(ability.rules).toEqual([{ action: "manage", subject: "all" }]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update the rules when a change is published", async () => {
    vi.useFakeTimers();
    try {
      entityMapper.load.mockRejectedValue("no initial config");
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      expect(entityMapper.load).toHaveBeenCalled();
      // Default rule
      expect(ability.rules).toEqual([{ action: "manage", subject: "all" }]);

      entityUpdates.next({
        entity: new Config(Config.PERMISSION_KEY, rules),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.rules).toEqual(rules["user_app"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update the ability with the received rules for the logged in user", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      vi.spyOn(ability, "update");
      entityUpdates.next({
        entity: new Config(Config.PERMISSION_KEY, rules),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.update).toHaveBeenCalledWith(rules.user_app);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update the ability with rules for all roles the logged in user has", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      vi.spyOn(ability, "update");
      TestBed.inject(SessionSubject).next({
        name: "testAdmin",
        id: "1",
        roles: ["user_app", "admin_app"],
      });

      entityUpdates.next({
        entity: new Config(Config.PERMISSION_KEY, rules),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.update).toHaveBeenCalledWith(
        rules.user_app.concat(rules.admin_app),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should create an ability that correctly uses the defined rules", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      entityUpdates.next({
        entity: new Config(Config.PERMISSION_KEY, rules),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.can("read", TestEntity)).toBe(true);
      expect(ability.can("create", TestEntity)).toBe(false);
      expect(ability.can("manage", TestEntity)).toBe(false);
      expect(ability.can("read", new TestEntity())).toBe(true);
      expect(ability.can("create", new TestEntity())).toBe(false);
      expect(ability.can("manage", Note)).toBe(false);
      expect(ability.can("manage", new Note())).toBe(false);
      expect(ability.can("create", new Note())).toBe(false);

      TestBed.inject(SessionSubject).next({
        name: "testAdmin",
        id: "1",
        roles: ["user_app", "admin_app"],
      });

      const updatedConfig = new Config(Config.PERMISSION_KEY, rules);
      updatedConfig._rev = "update";
      entityUpdates.next({ entity: updatedConfig, type: "update" });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.can("manage", TestEntity)).toBe(true);
      expect(ability.can("manage", new TestEntity())).toBe(true);
      expect(ability.can("manage", Note)).toBe(true);
      expect(ability.can("manage", new Note())).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should throw an error when checking permissions on a object that is not a Entity", () => {
    entityUpdates.next({
      entity: new Config(Config.PERMISSION_KEY, rules),
      type: "update",
    });

    class TestClass {}

    expect(() => ability.can("read", new TestClass() as any)).toThrowError();
  });

  it("should call the ability enforcer after updating the rules", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      entityUpdates.next({
        entity: new Config(Config.PERMISSION_KEY, rules),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(
        TestBed.inject(PermissionEnforcerService).enforcePermissionsOnLocalData,
      ).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should allow to access user properties in the rules", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      async function testPlaceholderCondition(placeholder: string) {
        const config = new Config<DatabaseRules>(Config.PERMISSION_KEY, {
          user_app: [
            {
              subject: "TestEntity",
              action: "manage",
              conditions: { _id: placeholder },
            },
          ],
        });
        entityUpdates.next({ entity: config, type: "update" });
        await vi.advanceTimersByTimeAsync(0);

        const userEntity = new TestEntity(TEST_USER);
        expect(ability.can("manage", userEntity)).toBe(true);
        const anotherUser = new TestEntity();
        expect(ability.cannot("manage", anotherUser)).toBe(true);
      }

      await testPlaceholderCondition("${user.name}");
      await testPlaceholderCondition("${user.entityId}");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should handle undefined user entityId in permission rules without error", async () => {
    vi.useFakeTimers();
    try {
      // Create a session with undefined entityId (user account without linked entity)
      TestBed.inject(SessionSubject).next({
        name: "user-without-entity",
        id: "1",
        roles: ["user_app"],
        entityId: undefined, // User account exists but has no linked entity
      });
      TestBed.inject(CurrentUserSubject).next(null); // No linked user entity

      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      const debugSpy = vi.spyOn(Logging, "debug");

      // Create rules that reference the user's entityId
      const config = new Config<DatabaseRules>(Config.PERMISSION_KEY, {
        user_app: [
          {
            subject: "TestEntity",
            action: "manage",
            conditions: { _id: "${user.entityId}" }, // This will be undefined
          },
        ],
      });

      entityUpdates.next({ entity: config, type: "update" });
      await vi.advanceTimersByTimeAsync(0);

      // Verify that undefined variables are logged
      expect(debugSpy).toHaveBeenCalledWith(
        "[AbilityService] Variable not defined:",
        "user.entityId",
      );

      // Verify that permission checks work gracefully (undefined becomes static placeholder in condition)
      const testEntity = new TestEntity(TEST_USER);
      // When entityId is undefined, the condition "_id: <PLACEHOLDER>" won't match any entity
      expect(ability.cannot("manage", testEntity)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should allow to check conditions with complex data types", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

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
      await vi.advanceTimersByTimeAsync(0);

      const note = new Note();
      expect(ability.can("read", note)).toBe(false);
      note.category = classInteraction;
      await vi.advanceTimersByTimeAsync(0);
      expect(ability.can("read", note)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should log a warning if no rules are found for a user", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);

      TestBed.inject(SessionSubject).next({
        name: "new-user",
        id: "1",
        roles: ["invalid_role"],
      });
      const warnSpy = vi.spyOn(Logging, "warn");
      entityUpdates.next({
        entity: new Config(Config.PERMISSION_KEY, rules),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(warnSpy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should prepend default rules to all users", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);
      const defaultRules: DatabaseRule[] = [
        { subject: "Config", action: "read" },
        { subject: "ProgressDashboardConfig", action: "manage" },
      ];
      const config = new Config<DatabaseRules>(
        Config.PERMISSION_KEY,
        Object.assign({ default: defaultRules } as DatabaseRules, rules),
      );

      entityUpdates.next({ entity: config, type: "update" });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.rules).toEqual(defaultRules.concat(...rules.user_app));

      TestBed.inject(SessionSubject).next({
        name: "admin",
        id: "1",
        roles: ["user_app", "admin_app"],
      });

      config._rev = "update";
      entityUpdates.next({ entity: config, type: "update" });
      await vi.advanceTimersByTimeAsync(0);
      expect(ability.rules).toEqual(
        defaultRules.concat(...rules.user_app, ...rules.admin_app),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should allow everything if permission doc has been deleted", async () => {
    vi.useFakeTimers();
    try {
      service.initializeRules();
      await vi.advanceTimersByTimeAsync(0);
      entityUpdates.next({
        type: "new",
        entity: new Config<DatabaseRules>(Config.PERMISSION_KEY, rules),
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.rules).toEqual(rules["user_app"]);

      entityUpdates.next({
        type: "remove",
        entity: new Config<DatabaseRules>(Config.PERMISSION_KEY),
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(ability.rules).toEqual([{ subject: "all", action: "manage" }]);
    } finally {
      vi.useRealTimers();
    }
  });
});
