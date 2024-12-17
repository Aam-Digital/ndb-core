import { TestBed } from "@angular/core/testing";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { FirebaseNotificationService } from "./firebase-messaging-service.service";

describe("FirebaseNotificationService", () => {
  let service: FirebaseNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FirebaseNotificationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
