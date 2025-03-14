import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { NotificationService } from "./notification.service";
import { provideHttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { MockedTestingModule } from "app/utils/mocked-testing.module";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer mock-token";
  }
}

describe("NotificationService", () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: KeycloakAuthService, useClass: MockKeycloakAuthService },
      ],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
