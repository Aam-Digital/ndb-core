import { TestBed } from "@angular/core/testing";

import { EmailClientService } from "./email-client.service";

describe("EmailClientService", () => {
  let service: EmailClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
