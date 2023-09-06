import { LocalAuthService } from "./local-auth.service";
import { AuthUser } from "../auth-user";
import { PouchDatabase } from "../../../database/pouch-database";
import { environment } from "../../../../../environments/environment";
import { SessionType } from "../../session-type";
import { TEST_USER } from "../../../../utils/mock-local-session";

describe("LocalAuthService", () => {
  let service: LocalAuthService;
  let testUser: AuthUser;
  let database: jasmine.SpyObj<PouchDatabase>;

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    database = jasmine.createSpyObj([
      "initInMemoryDB",
      "initIndexedDB",
      "isEmpty",
    ]);
    service = new LocalAuthService();
  });

  beforeEach(() => {
    testUser = {
      name: TEST_USER,
      roles: ["user_app"],
    };
    service.saveUser(testUser);
  });

  afterEach(() => {
    service.removeLastUser();
  });

  it("should be created", () => {
    expect(service).toBeDefined();
  });

  it("should save user objects to local storage", () => {
    const storedUser: AuthUser = JSON.parse(
      window.localStorage.getItem(testUser.name),
    );
    expect(storedUser.name).toBe(testUser.name);
    expect(storedUser.roles).toEqual(testUser.roles);
  });

  it("should login a previously saved user", () => {
    expect(service.login()).toEqual(testUser);
  });

  it("should fail login after a user is removed", async () => {
    service.removeLastUser();
    expect(() => service.login()).toThrowError();
  });
});
