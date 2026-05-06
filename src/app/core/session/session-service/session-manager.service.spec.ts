import { SessionManagerService } from "./session-manager.service";
import { LoginState } from "../session-states/login-state.enum";
import { SyncState } from "../session-states/sync-state.enum";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session-type";
import { TestBed, waitForAsync } from "@angular/core/testing";
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
import type { Mock } from "vitest";

type KeycloakAuthServiceMock = Pick<
  KeycloakAuthService,
  "login" | "logout" | "addAuthHeader"
> & {
  login: Mock;
  logout: Mock;
  addAuthHeader: Mock;
};

type DatabaseResolverMock = Pick<
  DatabaseResolverService,
  "initDatabasesForSession" | "resetDatabases"
> & {
  initDatabasesForSession: Mock;
  resetDatabases: Mock;
};

type EntityMapperMock = Pick<EntityMapperService, "load" | "receiveUpdates"> & {
  load: Mock;
  receiveUpdates: Mock;
};

describe("SessionManagerService", () => {
  let service: SessionManagerService;
  let loginStateSubject: LoginStateSubject;
  let sessionInfo: SessionSubject;
  let mockKeycloak: KeycloakAuthServiceMock;
  let mockNavigator: {
    onLine: boolean;
  };
  let dbUser: SessionInfo;
  let mockDatabaseResolver: DatabaseResolverMock;
  let mockedEntityMapper: EntityMapperMock;
  let mockedEntityMapperUpdates: Subject<UpdatedEntity<any>>;

  beforeEach(waitForAsync(() => {
    dbUser = { name: TEST_USER, id: "99", roles: ["user_app"] };
    mockKeycloak = {
      login: vi.fn(),
      logout: vi.fn(),
      addAuthHeader: vi.fn(),
    };
    mockKeycloak.login.mockResolvedValue(dbUser);
    mockNavigator = { onLine: true };
    mockDatabaseResolver = {
      initDatabasesForSession: vi.fn(),
      resetDatabases: vi.fn(),
    };
    mockedEntityMapper = {
      load: vi.fn(),
      receiveUpdates: vi.fn(),
    };
    mockedEntityMapperUpdates = new Subject();
    mockedEntityMapper.receiveUpdates.mockReturnValue(
      mockedEntityMapperUpdates,
    );
    mockedEntityMapper.load.mockRejectedValue(new Error());

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
    vi.spyOn(service, "remoteLoginAvailable").mockReturnValue(true);
  }));

  afterEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("should update the session info once authenticated", async () => {
    const updatedUser: SessionInfo = {
      name: TEST_USER,
      id: "101",
      roles: dbUser.roles.concat("admin"),
    };
    mockKeycloak.login.mockResolvedValue(updatedUser);
    const saveUserSpy = vi.spyOn(TestBed.inject(LocalAuthService), "saveUser");
    const syncStateSubject = TestBed.inject(SyncStateSubject);

    await service.remoteLogin();

    // Session state is available immediately after login, before sync completes
    expect(sessionInfo.value).toEqual(updatedUser);
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
    expect(saveUserSpy).not.toHaveBeenCalled();

    // Offline user entry is only saved once the first sync completes
    syncStateSubject.next(SyncState.COMPLETED);
    expect(saveUserSpy).toHaveBeenCalledWith(updatedUser);
  });

  it("should not register offline user before sync has completed", async () => {
    const saveUserSpy = vi.spyOn(TestBed.inject(LocalAuthService), "saveUser");

    await service.remoteLogin();
    // SyncState.COMPLETED not emitted yet

    expect(saveUserSpy).not.toHaveBeenCalled();
  });

  it("should not register offline user if logout happens before sync completes", async () => {
    const saveUserSpy = vi.spyOn(TestBed.inject(LocalAuthService), "saveUser");
    const syncStateSubject = TestBed.inject(SyncStateSubject);

    await service.remoteLogin();
    await service.logout();
    syncStateSubject.next(SyncState.COMPLETED);

    expect(saveUserSpy).not.toHaveBeenCalled();
  });

  it("should initialize current user as the entity to which a login is connected", async () => {
    vi.useFakeTimers();
    try {
      const loggedInUser = new TestEntity(TEST_USER);
      mockedEntityMapper.load.mockResolvedValue(loggedInUser);
      const currentUser = TestBed.inject(CurrentUserSubject);

      // first login with existing user entity
      mockKeycloak.login.mockResolvedValue({
        name: TEST_USER,
        id: "101",
        roles: [],
        entityId: loggedInUser.getId(),
      });
      service.remoteLogin();
      await vi.advanceTimersByTimeAsync(0);

      // we somehow need this in the Test as the replay doesn't trigger
      TestBed.inject(ConfigService).entityUpdated.next(new Config());
      await vi.advanceTimersByTimeAsync(0);

      expect(currentUser.value).toEqual(loggedInUser);
      expect(mockedEntityMapper.load).toHaveBeenCalledWith(
        TestEntity.ENTITY_TYPE,
        loggedInUser.getId(),
      );

      // logout -> user should reset
      service.logout();
      await vi.advanceTimersByTimeAsync(0);
      expect(currentUser.value).toBeUndefined();

      const adminUser = new TestEntity("admin-user");
      // login, user entity not available yet
      mockedEntityMapper.load.mockRejectedValue(new Error());
      mockKeycloak.login.mockResolvedValue({
        name: "admin-user",
        id: "101",
        roles: ["admin"],
        entityId: adminUser.getId(),
      });
      service.remoteLogin();
      await vi.advanceTimersByTimeAsync(0);

      // user entity available -> user should be set
      mockedEntityMapper.load.mockResolvedValue(adminUser);
      mockedEntityMapperUpdates.next({ entity: adminUser, type: "new" });
      await vi.advanceTimersByTimeAsync(0);
      expect(currentUser.value).toEqual(adminUser);
      expect(mockedEntityMapper.load).toHaveBeenCalledWith(
        TestEntity.ENTITY_TYPE,
        adminUser.getId(),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not initialize the user entity if no entityId is set", async () => {
    vi.useFakeTimers();
    try {
      mockKeycloak.login.mockResolvedValue({
        name: "some-user",
        id: "101",
        roles: [],
      });
      mockedEntityMapper.load.mockClear();

      service.remoteLogin();
      await vi.advanceTimersByTimeAsync(0);

      // we somehow need this in the Test as the replay doesn't trigger
      TestBed.inject(ConfigService).entityUpdated.next(new Config());
      await vi.advanceTimersByTimeAsync(0);

      expect(mockedEntityMapper.load).not.toHaveBeenCalled();
      expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
      expect(TestBed.inject(CurrentUserSubject).value).toBeNull();
    } finally {
      vi.useRealTimers();
    }
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
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate");
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

  it("should set the skip-next-sso-check flag on remote logout", async () => {
    sessionStorage.removeItem(SessionManagerService.SKIP_NEXT_SSO_CHECK_KEY);
    await service.remoteLogin();

    await service.logout();

    expect(
      sessionStorage.getItem(SessionManagerService.SKIP_NEXT_SSO_CHECK_KEY),
    ).toBe("1");
  });

  it("should not set the skip-next-sso-check flag if no remote session was active", async () => {
    sessionStorage.removeItem(SessionManagerService.SKIP_NEXT_SSO_CHECK_KEY);
    await service.offlineLogin(dbUser);

    await service.logout();

    expect(
      sessionStorage.getItem(SessionManagerService.SKIP_NEXT_SSO_CHECK_KEY),
    ).toBeNull();
  });

  it("should skip the silent SSO check when the skip flag is set", async () => {
    sessionStorage.setItem(SessionManagerService.SKIP_NEXT_SSO_CHECK_KEY, "1");
    const remoteLoginAvailableSpy = vi
      .spyOn(service, "remoteLoginAvailable")
      .mockReturnValue(true);

    await service.checkRemoteSession();

    expect(loginStateSubject.value).toBe(LoginState.LOGIN_FAILED);
    // The skip-flag short-circuit means we should not even consult
    // remoteLoginAvailable() / Keycloak after logout.
    expect(remoteLoginAvailableSpy).not.toHaveBeenCalled();
    expect(
      sessionStorage.getItem(SessionManagerService.SKIP_NEXT_SSO_CHECK_KEY),
    ).toBeNull();
  });

  it("should use current user db if database has content", async () => {
    await service.remoteLogin();

    expect(mockDatabaseResolver.initDatabasesForSession).toHaveBeenCalledTimes(
      1,
    );

    expect(mockDatabaseResolver.initDatabasesForSession).toHaveBeenCalledWith(
      dbUser,
    );
  });
});
