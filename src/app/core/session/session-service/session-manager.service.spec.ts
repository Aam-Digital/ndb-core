import { SessionManagerService } from "./session-manager.service";
import { LoginState } from "../session-states/login-state.enum";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session-type";
import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { environment } from "../../../../environments/environment";
import { SessionInfo, SessionSubject } from "../auth/session-info";
import { LocalAuthService } from "../auth/local/local-auth.service";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { Router } from "@angular/router";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { CurrentUserSubject } from "../current-user-subject";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { Config } from "../../config/config";
import { ConfigService } from "../../config/config.service";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";

describe("SessionManagerService", () => {
  let service: SessionManagerService;
  let loginStateSubject: LoginStateSubject;
  let sessionInfo: SessionSubject;
  let mockKeycloak: jasmine.SpyObj<KeycloakAuthService>;
  let mockNavigator: { onLine: boolean };
  let dbUser: SessionInfo;
  let mockDatabaseResolver: jasmine.SpyObj<DatabaseResolverService>;
  let mockedEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockedEntityMapperUpdates: Subject<UpdatedEntity<any>>;

  beforeEach(waitForAsync(() => {
    dbUser = { name: TEST_USER, id: "99", roles: ["user_app"] };
    mockKeycloak = jasmine.createSpyObj(["login", "logout", "addAuthHeader"]);
    mockKeycloak.login.and.resolveTo(dbUser);
    mockNavigator = { onLine: true };
    mockDatabaseResolver = jasmine.createSpyObj([
      "initDatabasesForSession",
      "resetDatabases",
    ]);
    mockedEntityMapper = jasmine.createSpyObj(["load", "receiveUpdates"]);
    mockedEntityMapperUpdates = new Subject();
    mockedEntityMapper.receiveUpdates.and.returnValue(
      mockedEntityMapperUpdates,
    );
    mockedEntityMapper.load.and.rejectWith(new Error());

    TestBed.configureTestingModule({
      providers: [
        SessionManagerService,
        SyncStateSubject,
        LoginStateSubject,
        SessionSubject,
        CurrentUserSubject,
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: DatabaseResolverService, useValue: mockDatabaseResolver },
        { provide: KeycloakAuthService, useValue: mockKeycloak },
        { provide: NAVIGATOR_TOKEN, useValue: mockNavigator },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(),
            routerState: { snapshot: {} },
          },
        },
      ],
    });
    service = TestBed.inject(SessionManagerService);
    loginStateSubject = TestBed.inject(LoginStateSubject);
    sessionInfo = TestBed.inject(SessionSubject);

    TestBed.inject(LocalAuthService).saveUser(dbUser);
    environment.session_type = SessionType.mock;
    spyOn(service, "remoteLoginAvailable").and.returnValue(true);
  }));

  afterEach(async () => {
    localStorage.clear();
  });

  it("should update the session info once authenticated", async () => {
    const updatedUser: SessionInfo = {
      name: TEST_USER,
      id: "101",
      roles: dbUser.roles.concat("admin"),
    };
    mockKeycloak.login.and.resolveTo(updatedUser);
    const saveUserSpy = spyOn(TestBed.inject(LocalAuthService), "saveUser");

    await service.remoteLogin();

    expect(saveUserSpy).toHaveBeenCalledWith(updatedUser);
    expect(sessionInfo.value).toEqual(updatedUser);
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
  });

  it("should initialize current user as the entity to which a login is connected", fakeAsync(() => {
    const loggedInUser = new TestEntity(TEST_USER);
    mockedEntityMapper.load.and.resolveTo(loggedInUser);
    const currentUser = TestBed.inject(CurrentUserSubject);

    // first login with existing user entity
    mockKeycloak.login.and.resolveTo({
      name: TEST_USER,
      id: "101",
      roles: [],
      entityId: loggedInUser.getId(),
    });
    service.remoteLogin();
    tick();

    // we somehow need this in the Test as the replay doesn't trigger
    TestBed.inject(ConfigService).entityUpdated.next(new Config());
    tick();

    expect(currentUser.value).toEqual(loggedInUser);
    expect(mockedEntityMapper.load).toHaveBeenCalledWith(
      TestEntity.ENTITY_TYPE,
      loggedInUser.getId(),
    );

    // logout -> user should reset
    service.logout();
    tick();
    expect(currentUser.value).toBeUndefined();

    const adminUser = new TestEntity("admin-user");
    // login, user entity not available yet
    mockedEntityMapper.load.and.rejectWith();
    mockKeycloak.login.and.resolveTo({
      name: "admin-user",
      id: "101",
      roles: ["admin"],
      entityId: adminUser.getId(),
    });
    service.remoteLogin();
    tick();

    // user entity available -> user should be set
    mockedEntityMapper.load.and.resolveTo(adminUser);
    mockedEntityMapperUpdates.next({ entity: adminUser, type: "new" });
    tick();
    expect(currentUser.value).toEqual(adminUser);
    expect(mockedEntityMapper.load).toHaveBeenCalledWith(
      TestEntity.ENTITY_TYPE,
      adminUser.getId(),
    );
  }));

  it("should not initialize the user entity if no entityId is set", fakeAsync(() => {
    mockKeycloak.login.and.resolveTo({
      name: "some-user",
      id: "101",
      roles: [],
    });
    mockedEntityMapper.load.calls.reset();

    service.remoteLogin();
    tick();

    // we somehow need this in the Test as the replay doesn't trigger
    TestBed.inject(ConfigService).entityUpdated.next(new Config());
    tick();

    expect(mockedEntityMapper.load).not.toHaveBeenCalled();
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
    expect(TestBed.inject(CurrentUserSubject).value).toBeNull();
  }));

  it("should automatically login, if the session is still valid", async () => {
    await service.remoteLogin();

    expect(loginStateSubject.value).toEqual(LoginState.LOGGED_IN);
    expect(sessionInfo.value).toEqual(dbUser);
  });

  it("should trigger remote logout if remote login succeeded before", async () => {
    await service.remoteLogin();

    service.logout();

    expect(mockKeycloak.logout).toHaveBeenCalled();
  });

  it("should only reset local state if remote login did not happen", async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    await service.offlineLogin(dbUser);
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
    expect(sessionInfo.value).toEqual(dbUser);

    await service.logout();

    expect(mockKeycloak.logout).not.toHaveBeenCalled();
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_OUT);
    expect(sessionInfo.value).toBeUndefined();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it("should store information if remote session needs to be reset", async () => {
    await service.remoteLogin();
    mockNavigator.onLine = false;

    await service.logout();

    expect(
      localStorage.getItem(service.RESET_REMOTE_SESSION_KEY),
    ).toBeDefined();
  });

  it("should trigger a remote logout if reset flag has been set", async () => {
    localStorage.setItem(service.RESET_REMOTE_SESSION_KEY, "true");

    service.clearRemoteSessionIfNecessary();

    expect(mockKeycloak.logout).toHaveBeenCalled();
  });

  it("should use current user db if database has content", async () => {
    await service.remoteLogin();

    expect(
      mockDatabaseResolver.initDatabasesForSession,
    ).toHaveBeenCalledOnceWith(dbUser);
  });
});
