import { LocalAuthService } from "./local-auth.service";
import { AuthUser } from "../auth-user";
import { TEST_USER } from "../../../../utils/mock-local-session";

describe("LocalAuthService", () => {
  let service: LocalAuthService;
  let testUser: AuthUser;

  beforeEach(() => {
    service = new LocalAuthService();
  });

  it("should be created", () => {
    expect(service).toBeDefined();
  });

  it("should return saved users", () => {
    testUser = {
      name: TEST_USER,
      roles: ["user_app"],
    };
    service.saveUser(testUser);

    expect(service.getStoredUsers()).toEqual([testUser]);

    localStorage.clear();
  });
});
