import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { AbilityService, detectEntityType } from "./ability.service";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { of, Subject, throwError } from "rxjs";
import { AppConfig } from "../app-config/app-config";
import { SessionService } from "../session/session-service/session.service";
import { Child } from "../../child-dev-project/children/model/child";
import { Note } from "../../child-dev-project/notes/model/note";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { SyncState } from "../session/session-states/sync-state.enum";
import { DatabaseRules, EntityAbility, EntityRule } from "./permission-types";
import { LoginState } from "../session/session-states/login-state.enum";

describe("AbilityService", () => {
  let service: AbilityService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  const mockDBEndpoint = "https://example.com/db/";
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let ability: EntityAbility;
  let mockSyncState: Subject<SyncState>;
  let mockLoginState: Subject<LoginState>;

  beforeEach(() => {
    AppConfig.settings = { database: { remote_url: mockDBEndpoint } } as any;
    mockHttpClient = jasmine.createSpyObj(["get"]);
    mockHttpClient.get.and.callFake(() => of(getRawRules() as any));
    mockSyncState = new Subject<SyncState>();
    mockLoginState = new Subject<LoginState>();
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"], {
      syncState: mockSyncState,
      loginState: mockLoginState,
    });
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testUser",
      roles: ["user_app"],
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        {
          provide: EntityAbility,
          useValue: new EntityAbility([], {
            detectSubjectType: detectEntityType,
          }),
        },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntityMapperService, useValue: undefined },
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

  it("should fetch the rules object from the backend", () => {
    mockLoginState.next(LoginState.LOGGED_IN);

    expect(mockHttpClient.get).toHaveBeenCalledWith(mockDBEndpoint + "rules", {
      withCredentials: true,
    });
  });

  it("should retry fetching the rules after the sync has started", () => {
    mockHttpClient.get.and.returnValues(
      throwError("first error"),
      of(getRawRules())
    );

    mockLoginState.next(LoginState.LOGGED_IN);

    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

    mockSyncState.next(SyncState.STARTED);

    expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
  });

  it("should update the ability with the received rules for the logged in user", async () => {
    spyOn(ability, "update");

    await mockLoginState.next(LoginState.LOGGED_IN);

    expect(ability.update).toHaveBeenCalledWith(getParsedRules().user_app);
  });

  it("should update the ability with rules for all roles the logged in user has", async () => {
    spyOn(ability, "update");
    mockSessionService.getCurrentUser.and.returnValue({
      name: "testAdmin",
      roles: ["user_app", "admin_app"],
    });

    await mockLoginState.next(LoginState.LOGGED_IN);

    expect(ability.update).toHaveBeenCalledWith(
      getParsedRules().user_app.concat(getParsedRules().admin_app)
    );
  });

  it("should create an ability that correctly uses the defined rules", async () => {
    await mockLoginState.next(LoginState.LOGGED_IN);

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
    await mockLoginState.next(LoginState.LOGGED_IN);

    expect(ability.can("manage", Child)).toBeTrue();
    expect(ability.can("manage", new Child())).toBeTrue();
    expect(ability.can("manage", Note)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();
  });

  it("should throw an error when checking permissions on a object that is not a Entity", async () => {
    await mockLoginState.next(LoginState.LOGGED_IN);
    class TestClass {}

    expect(() => ability.can("read", new TestClass() as any)).toThrowError();
  });

  it("should give all permissions if no rules object can be fetched", fakeAsync(() => {
    mockHttpClient.get.and.returnValue(
      throwError(() => new HttpErrorResponse({}))
    );

    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    // Request failed, sync not started - offline without cached rules object
    expect(ability.can("read", Child)).toBeTrue();
    expect(ability.can("update", Child)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();

    mockSyncState.next(SyncState.STARTED);
    tick();

    // Request failed, sync started - no rules object exists
    expect(ability.can("read", Child)).toBeTrue();
    expect(ability.can("update", Child)).toBeTrue();
    expect(ability.can("manage", new Note())).toBeTrue();
  }));

  it("should notify when the rules are updated", (done) => {
    spyOn(ability, "update");
    service.abilityUpdateNotifier.subscribe(() => {
      expect(ability.update).toHaveBeenCalled();
      done();
    });

    mockLoginState.next(LoginState.LOGGED_IN);
  });

  function getRawRules(): DatabaseRules {
    return {
      user_app: [
        { subject: "Child", action: "read" },
        { subject: "Note", action: "manage", inverted: true },
      ],
      admin_app: [{ subject: "all", action: "manage" }],
    };
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
