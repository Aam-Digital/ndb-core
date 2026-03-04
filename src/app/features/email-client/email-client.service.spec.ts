import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";

import { EmailClientService } from "./email-client.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { WINDOW_TOKEN } from "#src/app/utils/di-tokens";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";

describe("EmailClientService", () => {
  let service: EmailClientService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockWindow: jasmine.SpyObj<Window>;

  class EntityWithEmail extends Entity {
    @DatabaseField({ dataType: EmailDatatype.dataType })
    email?: string;
  }

  beforeEach(() => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockWindow = jasmine.createSpyObj("Window", [], {
      location: { href: "" },
    });

    TestBed.configureTestingModule({
      providers: [
        EmailClientService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        {
          provide: FormDialogService,
          useValue: jasmine.createSpyObj("FormDialogService", ["openView"]),
        },
        {
          provide: ConfirmationDialogService,
          useValue: jasmine.createSpyObj("ConfirmationDialogService", [
            "getConfirmation",
          ]),
        },
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

    const mockConfirmation = TestBed.inject(
      ConfirmationDialogService,
    ) as jasmine.SpyObj<ConfirmationDialogService>;

    mockDialog.open.and.returnValue({
      afterClosed: () => of(undefined),
    } as any);

    const result = await service.executeMailto(fakeEntity);

    expect(result).toBeFalse();
    expect(mockConfirmation.getConfirmation).toHaveBeenCalled();
  }));

  it("should generate mailto link with bcc for multiple emails", () => {
    const emails = "test@example.com,john@example.com";
    const subject = "Subject";
    const body = "Body";

    const mailto = service.buildMailtoLink(emails, subject, body, true);

    expect(mailto).toBe(
      "mailto:?bcc=test%40example.com%2Cjohn%40example.com&subject=Subject&body=Body",
    );
  });

  it("should generate mailto link with to for group email", () => {
    const emails = "test@example.com,john@example.com";
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

  it("should generate mailto link with semicolon-separated recipients when sendSemicolonSeparated is true", fakeAsync(() => {
    const entity1 = new EntityWithEmail();
    entity1.email = "test@example.com";
    const entity2 = new EntityWithEmail();
    entity2.email = "john@example.com";
    const entity3 = new EntityWithEmail();
    entity3.email = "jane@example.com";

    mockDialog.open.and.returnValue({
      afterClosed: () =>
        of({
          template: { subject: "Subject", body: "Body" },
          createNote: false,
          sendAsBCC: false,
          sendSemicolonSeparated: true,
        }),
      close: jasmine.createSpy("close"),
    } as any);

    service.executeMailto([entity1, entity2, entity3]);
    tick(5000); // Fast-forward through the setTimeout

    const mailtoCall = mockWindow.location.href;

    expect(mailtoCall).toContain("%3B"); // %3B is the encoded semicolon
    expect(mailtoCall).not.toContain("%2C"); // %2C is the encoded comma
    expect(mailtoCall).toBe(
      "mailto:test%40example.com%3Bjohn%40example.com%3Bjane%40example.com?subject=Subject&body=Body",
    );
  }));

  it("should generate mailto link with comma-separated recipients when sendSemicolonSeparated is false", fakeAsync(() => {
    const entity1 = new EntityWithEmail();
    entity1.email = "test@example.com";
    const entity2 = new EntityWithEmail();
    entity2.email = "john@example.com";
    const entity3 = new EntityWithEmail();
    entity3.email = "jane@example.com";

    mockDialog.open.and.returnValue({
      afterClosed: () =>
        of({
          template: { subject: "Subject", body: "Body" },
          createNote: false,
          sendAsBCC: false,
          sendSemicolonSeparated: false,
        }),
      close: jasmine.createSpy("close"),
    } as any);

    service.executeMailto([entity1, entity2, entity3]);
    tick(5000); // Fast-forward through the setTimeout

    const mailtoCall = mockWindow.location.href;

    expect(mailtoCall).toContain("%2C"); // %2C is the encoded comma
    expect(mailtoCall).not.toContain("%3B"); // %3B is the encoded semicolon
    expect(mailtoCall).toBe(
      "mailto:test%40example.com%2Cjohn%40example.com%2Cjane%40example.com?subject=Subject&body=Body",
    );
  }));
});
