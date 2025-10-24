import { TestBed, waitForAsync } from "@angular/core/testing";

import { EmailClientService } from "./email-client.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { MarkdownModule } from "ngx-markdown";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";

fdescribe("EmailClientService", () => {
  let service: EmailClientService;
  let mockRegistry: jasmine.SpyObj<EntityRegistry>;
  let mockAlert: jasmine.SpyObj<AlertService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  class EntityWithEmail extends Entity {
    @DatabaseField({ dataType: EmailDatatype.dataType })
    email?: string;
  }

  beforeEach(() => {
    mockRegistry = jasmine.createSpyObj("EntityRegistry", ["get"]);
    mockAlert = jasmine.createSpyObj("AlertService", ["addWarning"]);
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

    TestBed.configureTestingModule({
      imports: [MarkdownModule.forRoot()],
      providers: [
        EmailClientService,
        { provide: EntityRegistry, useValue: mockRegistry },
        { provide: AlertService, useValue: mockAlert },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });

    service = TestBed.inject(EmailClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should show warning and return false if email field exists but value is missing", waitForAsync(async () => {
    const fakeEntity = new EntityWithEmail();
    fakeEntity.email = undefined;
    mockRegistry.get.and.returnValue(EntityWithEmail);
    mockDialog.open.and.returnValue({
      afterClosed: () => of(undefined),
    } as any);

    const result = await service.executeMailto(fakeEntity);

    expect(result).toBeFalse();
    expect(mockDialog.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({
        data: jasmine.objectContaining({
          title: "Email Error",
          text: "Please fill an email address for this record to use this functionality.",
        }),
      }),
    );
  }));

  it("should generate mailto link with bcc for multiple emails", () => {
    const emails = ["test@example.com", "john@example.com"];
    const subject = "Subject";
    const body = "Body";

    const mailto = service.buildMailtoLink(emails, subject, body, true);

    expect(mailto).toBe(
      "mailto:?bcc=test%40example.com%2Cjohn%40example.com&subject=Subject&body=Body",
    );
  });

  it("should generate mailto link with to for group email", () => {
    const emails = ["test@example.com", "john@example.com"];
    const subject = "Subject";
    const body = "Body";

    const mailto = service.buildMailtoLink(emails, subject, body, false);

    expect(mailto).toBe(
      "mailto:test%40example.com%2Cjohn%40example.com?subject=Subject&body=Body",
    );
  });

  it("should generate mailto link with to for single email", () => {
    const email = "test@example.com";
    const subject = "Subject";
    const body = "Body";

    const mailto = service.buildMailtoLink(email, subject, body, false);

    expect(mailto).toBe("mailto:test%40example.com?subject=Subject&body=Body");
  });
});
