import { TestBed } from "@angular/core/testing";

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
import type { Observable } from "rxjs";
import type { Mock } from "vitest";

type DialogRefMock = {
  afterClosed: () => Observable<unknown>;
  close?: Mock;
};

type MatDialogMock = {
  open: Mock;
};

type WindowMock = {
  location: { href: string };
};

type ConfirmationDialogServiceMock = {
  getConfirmation: Mock;
};

describe("EmailClientService", () => {
  let service: EmailClientService;
  let mockDialog: MatDialogMock;
  let mockWindow: WindowMock;
  let mockConfirmationDialog: ConfirmationDialogServiceMock;

  class EntityWithEmail extends Entity {
    @DatabaseField({ dataType: EmailDatatype.dataType })
    email?: string;
  }

  beforeEach(() => {
    mockDialog = {
      open: vi.fn().mockName("MatDialog.open"),
    };
    mockWindow = {
      location: { href: "" },
    };
    mockConfirmationDialog = {
      getConfirmation: vi
        .fn()
        .mockName("ConfirmationDialogService.getConfirmation"),
    };

    TestBed.configureTestingModule({
      providers: [
        EmailClientService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        {
          provide: FormDialogService,
          useValue: {
            openView: vi.fn().mockName("FormDialogService.openView"),
          },
        },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    });

    service = TestBed.inject(EmailClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should show warning and return false if email field exists but value is missing", async () => {
    const fakeEntity = new EntityWithEmail();
    fakeEntity.email = undefined;

    mockDialog.open.mockReturnValue({
      afterClosed: () => of(undefined),
    } satisfies DialogRefMock);

    const result = await service.executeMailto(fakeEntity);

    expect(result).toBe(false);
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
  });

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

  it("should generate mailto link with semicolon-separated recipients when sendSemicolonSeparated is true", async () => {
    vi.useFakeTimers();
    try {
      const entity1 = new EntityWithEmail();
      entity1.email = "test@example.com";
      const entity2 = new EntityWithEmail();
      entity2.email = "john@example.com";
      const entity3 = new EntityWithEmail();
      entity3.email = "jane@example.com";

      mockDialog.open.mockReturnValue({
        afterClosed: () =>
          of({
            template: { subject: "Subject", body: "Body" },
            createNote: false,
            sendAsBCC: false,
            sendSemicolonSeparated: true,
          }),
        close: vi.fn(),
      } satisfies DialogRefMock);

      service.executeMailto([entity1, entity2, entity3]);
      await vi.advanceTimersByTimeAsync(5000); // Fast-forward through the setTimeout

      const mailtoCall = mockWindow.location.href;

      expect(mailtoCall).toContain("%3B"); // %3B is the encoded semicolon
      expect(mailtoCall).not.toContain("%2C"); // %2C is the encoded comma
      expect(mailtoCall).toBe(
        "mailto:test%40example.com%3Bjohn%40example.com%3Bjane%40example.com?subject=Subject&body=Body",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should generate mailto link with comma-separated recipients when sendSemicolonSeparated is false", async () => {
    vi.useFakeTimers();
    try {
      const entity1 = new EntityWithEmail();
      entity1.email = "test@example.com";
      const entity2 = new EntityWithEmail();
      entity2.email = "john@example.com";
      const entity3 = new EntityWithEmail();
      entity3.email = "jane@example.com";

      mockDialog.open.mockReturnValue({
        afterClosed: () =>
          of({
            template: { subject: "Subject", body: "Body" },
            createNote: false,
            sendAsBCC: false,
            sendSemicolonSeparated: false,
          }),
        close: vi.fn(),
      } satisfies DialogRefMock);

      service.executeMailto([entity1, entity2, entity3]);
      await vi.advanceTimersByTimeAsync(5000); // Fast-forward through the setTimeout

      const mailtoCall = mockWindow.location.href;

      expect(mailtoCall).toContain("%2C"); // %2C is the encoded comma
      expect(mailtoCall).not.toContain("%3B"); // %3B is the encoded semicolon
      expect(mailtoCall).toBe(
        "mailto:test%40example.com%2Cjohn%40example.com%2Cjane%40example.com?subject=Subject&body=Body",
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
