import { SessionManagerService } from "./session-manager.service";
import { LoginState } from "../session-states/login-state.enum";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session-type";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";
import { environment } from "../../../../environments/environment";
import { SessionInfo, SessionSubject } from "../auth/session-info";
import { LocalAuthService } from "../auth/local/local-auth.service";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { Router } from "@angular/router";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { CurrentUserSubject } from "../current-user-subject";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { DatabaseResolverService } from "../../database/database-resolver.service";

// TODO: Fix tests
xdescribe("SessionManagerService", () => {
  let service: SessionManagerService;
  let loginStateSubject: LoginStateSubject;
  let sessionInfo: SessionSubject;
  let mockKeycloak: jasmine.SpyObj<KeycloakAuthService>;
  let mockNavigator: { onLine: boolean };
  let dbUser: SessionInfo;
  const userDBName = `${TEST_USER}-${environment.DB_NAME}`;
  let mockDatabaseResolver: jasmine.SpyObj<DatabaseResolverService>;

  beforeEach(waitForAsync(() => {
    dbUser = { name: TEST_USER, id: "99", roles: ["user_app"] };
    mockKeycloak = jasmine.createSpyObj(["login", "logout", "addAuthHeader"]);
    mockKeycloak.login.and.resolveTo(dbUser);
    mockNavigator = { onLine: true };
    mockDatabaseResolver = jasmine.createSpyObj([
      "initDatabasesForSession",
      "resetDatabases",
    ]);

    TestBed.configureTestingModule({
      providers: [
        SessionManagerService,
        SyncStateSubject,
        LoginStateSubject,
        SessionSubject,
        CurrentUserSubject,
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(),
        },
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
    const tmpDB = new PouchDatabase(userDBName);
    tmpDB.init();
    await tmpDB.destroy();
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

  it("should initialize current user as the entity to which a login is connected", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const loggedInUser = new TestEntity(TEST_USER);
    const otherUser = new TestEntity("other_user");
    await entityMapper.saveAll([loggedInUser, otherUser]);
    const currentUser = TestBed.inject(CurrentUserSubject);

    // first login with existing user entity
    mockKeycloak.login.and.resolveTo({
      name: TEST_USER,
      id: "101",
      roles: [],
      entityId: loggedInUser.getId(),
    });
    await service.remoteLogin();
    expect(currentUser.value).toEqual(loggedInUser);

    // logout -> user should reset
    await service.logout();
    expect(currentUser.value).toBeUndefined();

    const adminUser = new TestEntity("admin-user");
    // login, user entity not available yet
    mockKeycloak.login.and.resolveTo({
      name: "admin-user",
      id: "101",
      roles: ["admin"],
      entityId: adminUser.getId(),
    });
    await service.remoteLogin();

    // user entity available -> user should be set
    await entityMapper.save(adminUser);
    expect(currentUser.value).toEqual(adminUser);
  });

  it("should not initialize the user entity if no entityId is set", async () => {
    const loadSpy = spyOn(TestBed.inject(EntityMapperService), "load");

    mockKeycloak.login.and.resolveTo({
      name: "some-user",
      id: "101",
      roles: [],
    });
    await service.remoteLogin();

    expect(loadSpy).not.toHaveBeenCalled();
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
    expect(TestBed.inject(CurrentUserSubject).value).toBeNull();
  });

  it("should allow other entities to log in", async () => {
    const loggedInChild = new TestEntity("123");
    const childSession: SessionInfo = {
      name: loggedInChild.getId(),
      id: "101",
      roles: [],
      entityId: loggedInChild.getId(),
    };
    mockKeycloak.login.and.resolveTo(childSession);
    const otherChild = new TestEntity("456");
    await TestBed.inject(EntityMapperService).saveAll([
      loggedInChild,
      otherChild,
    ]);

    await service.remoteLogin();

    expect(sessionInfo.value).toBe(childSession);
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
    expect(TestBed.inject(CurrentUserSubject).value).toEqual(loggedInChild);
  });

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

    service.logout();

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
    await defineExistingDatabases();

    await service.remoteLogin();

    expect(
      mockDatabaseResolver.initDatabasesForSession,
    ).toHaveBeenCalledOnceWith(dbUser);
  });

  async function defineExistingDatabases() {
    const tmpDB = new PouchDatabase(userDBName);
    tmpDB.init();
    await tmpDB.put({ _id: "someDoc" });
  }
});
