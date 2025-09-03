import { TestBed } from "@angular/core/testing";

import { EmailClientService } from "./email-client.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";

describe("EmailClientService", () => {
  let service: EmailClientService;
  let mockRegistry: jasmine.SpyObj<EntityRegistry>;
  let mockAlert: jasmine.SpyObj<AlertService>;

  beforeEach(() => {
    mockRegistry = jasmine.createSpyObj("EntityRegistry", ["get"]);
    mockAlert = jasmine.createSpyObj("AlertService", ["addWarning"]);

    TestBed.configureTestingModule({
      providers: [
        EmailClientService,
        { provide: EntityRegistry, useValue: mockRegistry },
        { provide: AlertService, useValue: mockAlert },
      ],
    });

    service = TestBed.inject(EmailClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should show warning and return false if email field exists but value is missing", async () => {
    const fakeEntity = {
      getType: () => "TestEntity",
      email: undefined,
    } as unknown as Entity;
    const FakeEntityConstructor: any = {
      schema: [{ id: "email", dataType: EmailDatatype.dataType }],
    };
    mockRegistry.get.and.returnValue(FakeEntityConstructor);
    const result = await service.executeMailto(fakeEntity);

    expect(result).toBeFalse();
    expect(mockAlert.addWarning).toHaveBeenCalledWith(
      "Please fill an email address for this record to use this functionality.",
    );
  });

  it("should generate mailto link with bcc for multiple emails", () => {
    const emails = ["test@example.com", "john@example.com"];
    const subject = "Subject";
    const body = "Body";

    const mailto = service.buildMailtoLink(emails, subject, body, true, true);
    expect(mailto).toContain("bcc=test%40example.com%2Cjohn%40example.com");
    expect(mailto).toContain("subject=Subject");
    expect(mailto).toContain("body=Body");
    expect(mailto.startsWith("mailto:?bcc=")).toBeTrue();
  });

  it("should generate mailto link with to for single email", () => {
    const email = "test@example.com";
    const subject = "Subject";
    const body = "Body";

    const mailto = service.buildMailtoLink(email, subject, body, false, false);
    expect(mailto).toContain("to=test%40example.com");
    expect(mailto).toContain("subject=Subject");
    expect(mailto).toContain("body=Body");
    expect(mailto.startsWith("mailto:test%40example.com?to=")).toBeTrue();
  });
});
