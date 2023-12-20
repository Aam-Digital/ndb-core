import { LocalAuthService } from "./local-auth.service";
import { SessionInfo } from "../session-info";
import { TEST_USER } from "../../../../utils/mock-local-session";

describe("LocalAuthService", () => {
  let service: LocalAuthService;
  let testUser: SessionInfo;

  beforeEach(() => {
    service = new LocalAuthService();
  });

  it("should be created", () => {
    expect(service).toBeDefined();
  });

  it("should return saved users", () => {
    localStorage.clear();
    testUser = {
      entityId: TEST_USER,
      roles: ["user_app"],
    };
    service.saveUser(testUser);

    expect(service.getStoredUsers()).toEqual([testUser]);

    localStorage.clear();
  });
});
