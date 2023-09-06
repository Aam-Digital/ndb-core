import { TestBed } from "@angular/core/testing";

import { KeycloakAuthService } from "./keycloak-auth.service";
import { HttpClient } from "@angular/common/http";
import { AuthUser } from "../auth-user";
import { TEST_USER } from "../../../../utils/mock-local-session";
import { KeycloakAngularModule } from "keycloak-angular";

describe("KeycloakAuthService", () => {
  let service: KeycloakAuthService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let dbUser: AuthUser;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj(["post"]);
    TestBed.configureTestingModule({
      imports: [KeycloakAngularModule],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        KeycloakAuthService,
      ],
    });
    dbUser = { name: TEST_USER, roles: ["user_app"] };
    service = TestBed.inject(KeycloakAuthService);
  });

  afterEach(() =>
    window.localStorage.removeItem(KeycloakAuthService.REFRESH_TOKEN_KEY),
  );

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
