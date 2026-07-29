import { LocalAuthService } from "./local-auth.service";
import { SessionInfo } from "../session-info";
import { TEST_USER } from "../../../user/demo-user-generator.service";
import { environment } from "../../../../../environments/environment";
import { SessionType } from "../../session-type";
import { TestBed } from "@angular/core/testing";
import { LOCAL_STORAGE_TOKEN } from "../../../../utils/di-tokens";
import { createFakeStorage } from "../../../../utils/test-utils/fake-storage";

describe("LocalAuthService", () => {
  let service: LocalAuthService;
  let testUser: SessionInfo;
  let mockDatabases: ReturnType<typeof vi.fn>;
  const originalSessionType = environment.session_type;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocalAuthService,
        { provide: LOCAL_STORAGE_TOKEN, useValue: createFakeStorage() },
      ],
    });
    service = TestBed.inject(LocalAuthService);
    mockDatabases = vi.fn().mockResolvedValue([]);
    vi.stubGlobal("indexedDB", { databases: mockDatabases });
    environment.session_type = SessionType.local;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    environment.session_type = originalSessionType;
  });

  it("should be created", () => {
    expect(service).toBeDefined();
  });

  it("should return saved users that have a local database", async () => {
    testUser = {
      name: TEST_USER,
      id: "101",
      roles: ["user_app"],
    };
    service.saveUser(testUser);
    mockDatabases.mockResolvedValue([{ name: "_pouch_101-app", version: 1 }]);

    expect(await service.getStoredUsers()).toEqual([testUser]);
  });

  it("should not return users without a local database", async () => {
    testUser = { name: TEST_USER, id: "101", roles: ["user_app"] };
    service.saveUser(testUser);
    mockDatabases.mockResolvedValue([]);

    expect(await service.getStoredUsers()).toEqual([]);
  });

  it("should also accept legacy (username-based) database names", async () => {
    testUser = { name: TEST_USER, id: "101", roles: ["user_app"] };
    service.saveUser(testUser);
    mockDatabases.mockResolvedValue([
      { name: `_pouch_${TEST_USER}-app`, version: 1 },
    ]);

    expect(await service.getStoredUsers()).toEqual([testUser]);
  });

  it("should not save user in online-only mode", () => {
    environment.session_type = SessionType.online;
    testUser = { name: TEST_USER, id: "101", roles: [] };

    service.saveUser(testUser);

    expect(localStorage.getItem("USER-" + testUser.name)).toBeNull();
  });
});
