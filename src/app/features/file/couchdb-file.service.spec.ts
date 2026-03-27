import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";

import { CouchdbFileService } from "./couchdb-file.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpStatusCode,
} from "@angular/common/http";
import { MatDialog } from "@angular/material/dialog";
import {
  BehaviorSubject,
  EMPTY,
  firstValueFrom,
  of,
  Subject,
  throwError,
} from "rxjs";
import { ShowFileComponent } from "./show-file/show-file.component";
import { Entity } from "../../core/entity/model/entity";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UpdatedEntity } from "../../core/entity/model/entity-update";
import {
  entityRegistry,
  EntityRegistry,
} from "../../core/entity/database-entity.decorator";
import { FileDatatype } from "./file.datatype";
import { SyncState } from "../../core/session/session-states/sync-state.enum";
import { SyncStateSubject } from "../../core/session/session-type";
import { map } from "rxjs/operators";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { environment } from "../../../environments/environment";
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";
import { NotAvailableOfflineError } from "../../core/session/not-available-offline.error";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import { SyncedPouchDatabase } from "../../core/database/pouchdb/synced-pouch-database";
import { AlertService } from "../../core/alerts/alert.service";

describe("CouchdbFileService", () => {
  let service: CouchdbFileService;
  let mockHttp: any;
  let mockDialog: any;
  let mockSnackbar: any;
  let mockAlertService: any;
  let dismiss: Mock;
  let updates: Subject<UpdatedEntity<Entity>>;
  const attachmentUrlPrefix = `${environment.DB_PROXY_PREFIX}/${Entity.DATABASE}-attachments`;
  let mockNavigator;
  let registeredEntityForTest = false;

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    mockDialog = {
      open: vi.fn(),
    };
    updates = new Subject();
    mockSnackbar = {
      openFromComponent: vi.fn(),
    };
    dismiss = vi.fn();
    mockSnackbar.openFromComponent.mockReturnValue({ dismiss } as any);
    mockAlertService = {
      addWarning: vi.fn(),
    };
    Entity.schema.set("testProp", {
      dataType: FileDatatype.dataType,
    });
    if (!entityRegistry.has("Entity")) {
      entityRegistry.add("Entity", Entity as any);
      registeredEntityForTest = true;
    }
    let mockDb = {
      ensureSynced: vi.fn(),
    };
    mockDb.ensureSynced.mockResolvedValue(undefined);
    mockNavigator = { onLine: true };

    TestBed.configureTestingModule({
      providers: [
        CouchdbFileService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: MatSnackBar, useValue: mockSnackbar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: AlertService, useValue: mockAlertService },
        {
          provide: EntityMapperService,
          useValue: { receiveUpdates: () => updates },
        },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: SyncStateSubject,
          useValue: of(SyncState.COMPLETED),
        },
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustUrl: (val: string) => val,
          },
        },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => mockDb },
        },
        { provide: NAVIGATOR_TOKEN, useValue: mockNavigator },
      ],
    });
    service = TestBed.inject(CouchdbFileService);
  });

  afterEach(() => {
    Entity.schema.delete("testProp");
    if (registeredEntityForTest) {
      entityRegistry.delete("Entity");
      registeredEntityForTest = false;
    }
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add a attachment to a existing document", async () => {
    vi.useFakeTimers();
    try {
      mockHttp.get.mockReturnValue(of({ _rev: "test_rev" }));
      mockHttp.put.mockReturnValue(of({ ok: true }));
      const file = new File([], "file.name", { type: "image/png" });
      const entity = new Entity("testId");

      service.uploadFile(file, entity, "testProp").subscribe();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.stringContaining(`${attachmentUrlPrefix}/Entity:testId`),
      );
      expect(mockHttp.put).toHaveBeenCalledWith(
        expect.stringContaining(
          `${attachmentUrlPrefix}/Entity:testId/testProp?rev=test_rev`,
        ),
        expect.anything(),
        expect.anything(),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should create attachment document if it does not exist yet (and complete a sync first)", async () => {
    mockHttp.get.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    mockHttp.put.mockReturnValue(of({ rev: "newRev" }));
    const file = new File([], "file.name", { type: "image/png" });
    const entity = new Entity("testId");

    service.uploadFile(file, entity, "testProp").subscribe(() => {
      // newly created entity has to be synced to server db for permission checks of attachment upload
      expect(
        (
          TestBed.inject(
            DatabaseResolverService,
          ).getDatabase() as SyncedPouchDatabase
        ).ensureSynced,
      ).toHaveBeenCalled();

      expect(mockHttp.put).toHaveBeenCalledWith(
        expect.stringContaining(`${attachmentUrlPrefix}/Entity:testId`),
        {},
      );
      expect(mockHttp.put).toHaveBeenCalledWith(
        expect.stringContaining(
          `${attachmentUrlPrefix}/Entity:testId/testProp?rev=newRev`,
        ),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  it("should forward any other errors", async () => {
    mockHttp.get.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    const file = { type: "image/png" } as File;

    service.uploadFile(file, new Entity("testId"), "testProp").subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(HttpErrorResponse);
        expect(err.status).toBe(401);
      },
    });
  });

  it("should throw NotAvailableOffline error for uploadFile if offline (and not make requests)", async () => {
    mockNavigator.onLine = false;

    service.uploadFile(null, new Entity("testId"), "testProp").subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(NotAvailableOfflineError);
        expect(mockHttp.put).not.toHaveBeenCalled();
      },
    });
  });
  it("should throw NotAvailableOffline error for removeFile if offline (and not make requests)", async () => {
    mockNavigator.onLine = false;

    service.removeFile(new Entity("testId"), "testProp").subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(NotAvailableOfflineError);
        expect(mockHttp.delete).not.toHaveBeenCalled();
      },
    });
  });

  it("should remove a file using the latest rev", () => {
    mockHttp.get.mockReturnValue(of({ _rev: "test_rev" }));
    mockHttp.delete.mockReturnValue(of({ ok: true }));
    const entity = new Entity("testId");

    service.removeFile(entity, "testProp").subscribe();

    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining(`${attachmentUrlPrefix}/Entity:testId`),
    );
    expect(mockHttp.delete).toHaveBeenCalledWith(
      expect.stringContaining(
        `${attachmentUrlPrefix}/Entity:testId/testProp?rev=test_rev`,
      ),
    );
  });

  it("should show progress while downloading a file", () => {
    const events = new Subject<HttpEvent<Blob>>();
    vi.spyOn(URL, "createObjectURL");
    vi.spyOn(window, "open");
    mockHttp.get.mockReturnValue(events);

    service.showFile(new Entity("testId"), "testProp");

    expect(mockSnackbar.openFromComponent).toHaveBeenCalled();
    // Code is only executed if observable is subscribed
    const data: any = vi.mocked(mockSnackbar.openFromComponent).mock.lastCall[1]
      .data;
    data.progress.subscribe();

    events.next({ type: HttpEventType.DownloadProgress, loaded: 1, total: 10 });
    expect(dismiss).not.toHaveBeenCalled();

    events.complete();
    expect(dismiss).toHaveBeenCalled();
  });

  it("should show a dialog if the popup couldn't be opened", () => {
    mockHttp.get.mockReturnValue(of({ type: HttpEventType.Response }));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("dataUrl");
    // no return value means popup couldn't be opened
    vi.spyOn(window, "open");

    service.showFile(new Entity("testId"), "testProp");

    expect(mockDialog.open).toHaveBeenCalledWith(ShowFileComponent, {
      data: "dataUrl",
    });
  });

  it("should show warning alert if file download returns 404", () => {
    mockHttp.get.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: HttpStatusCode.NotFound }),
      ),
    );
    const entity = new Entity("testId");
    entity["testProp"] = "missing-file.pdf";

    service.showFile(entity, "testProp");

    expect(mockAlertService.addWarning).toHaveBeenCalledWith(
      expect.stringContaining("not found"),
    );
  });

  it("should delete files document if a entity is deleted", async () => {
    vi.useFakeTimers();
    try {
      const entity = new Entity();
      mockHttp.get.mockReturnValue(of({ _rev: "someRev" }));
      mockHttp.delete.mockReturnValue(EMPTY);

      updates.next({ entity, type: "remove" });
      await vi.advanceTimersByTimeAsync(0);

      expect(mockHttp.get).toHaveBeenCalledWith(
        expect.stringContaining(entity.getId()),
      );
      expect(mockHttp.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/${entity.getId()}?rev=someRev`),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not fail if to-be-removed file reference could not be found", () => {
    mockHttp.get.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: HttpStatusCode.NotFound }),
      ),
    );

    return expect(
      firstValueFrom(service.removeFile(new Entity(), "testProp")),
    ).resolves.not.toThrow();
  });

  it("should wait for previous request to finish before starting a new one", async () => {
    vi.useFakeTimers();
    try {
      const firstPut = new BehaviorSubject({ ok: true });
      const secondPut = new BehaviorSubject({ ok: true });
      const thirdPut = new BehaviorSubject({ ok: true });
      const file1 = new File([], "file1.name", { type: "image/png" });
      const file2 = new File([], "file2.name", { type: "image/png" });
      const file3 = new File([], "file3.name", { type: "image/png" });
      const entity = new Entity("testId");
      mockHttp.get
        .mockReturnValueOnce(of({ _rev: "1-rev" }))
        .mockReturnValueOnce(of({ _rev: "2-rev" }))
        .mockReturnValueOnce(of({ _rev: "3-rev" }));
      mockHttp.put
        .mockReturnValueOnce(firstPut)
        .mockReturnValueOnce(secondPut)
        .mockReturnValueOnce(thirdPut);

      let file1Done = false;
      let file2Done = false;
      let file3Done = false;
      service
        .uploadFile(file1, entity, "prop1")
        .subscribe({ complete: () => (file1Done = true) });
      await vi.advanceTimersByTimeAsync(0);
      service
        .uploadFile(file2, entity, "prop2")
        .subscribe({ complete: () => (file2Done = true) });
      await vi.advanceTimersByTimeAsync(0);
      service
        .uploadFile(file3, entity, "prop3")
        .subscribe({ complete: () => (file3Done = true) });
      await vi.advanceTimersByTimeAsync(0);

      expect(firstPut.observed).toBe(true);
      expect(secondPut.observed).toBe(false);
      expect(mockHttp.put).toHaveBeenCalledTimes(1);
      expect(mockHttp.put).toHaveBeenCalledWith(
        expect.stringContaining(
          `${attachmentUrlPrefix}/Entity:testId/prop1?rev=1-rev`,
        ),
        expect.anything(),
        expect.anything(),
      );

      firstPut.complete();
      await vi.advanceTimersByTimeAsync(0);

      expect(file1Done).toBe(true);
      expect(file2Done).toBe(false);
      expect(file3Done).toBe(false);
      expect(secondPut.observed).toBe(true);
      expect(thirdPut.observed).toBe(false);
      expect(mockHttp.put).toHaveBeenCalledTimes(2);
      expect(mockHttp.put).toHaveBeenCalledWith(
        expect.stringContaining(
          `${attachmentUrlPrefix}/Entity:testId/prop2?rev=2-rev`,
        ),
        expect.anything(),
        expect.anything(),
      );

      secondPut.complete();
      await vi.advanceTimersByTimeAsync(0);

      expect(file2Done).toBe(true);
      expect(file3Done).toBe(false);
      expect(thirdPut.observed).toBe(true);
      expect(mockHttp.put).toHaveBeenCalledTimes(3);
      expect(mockHttp.put).toHaveBeenCalledWith(
        expect.stringContaining(
          `${attachmentUrlPrefix}/Entity:testId/prop3?rev=3-rev`,
        ),
        expect.anything(),
        expect.anything(),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should only request a file once per session", async () => {
    mockHttp.get.mockReturnValue(of(new Blob([])));
    const entity = new Entity();
    entity["file"] = "file.name";

    const first = await firstValueFrom(service.loadFile(entity, "file"));

    expect(mockHttp.get).toHaveBeenCalled();

    mockHttp.get.mockClear();
    const second = await firstValueFrom(service.loadFile(entity, "file"));

    expect(first).toEqual(second);
    expect(mockHttp.get).not.toHaveBeenCalled();

    URL.revokeObjectURL(second as string);
  });

  it("should cache uploaded files", () => {
    const file = new File([], "file.name", { type: "image/png" });
    const entity = new Entity("testId");
    mockHttp.get.mockReturnValue(of({ _rev: "1-rev" }));
    mockHttp.put.mockReturnValue(of({ type: HttpEventType.Response }));
    service.uploadFile(file, entity, "testProp").subscribe();
    mockHttp.get.mockClear();

    service.loadFile(entity, "testProp").subscribe();

    expect(mockHttp.get).not.toHaveBeenCalled();
  });

  it("should return empty blob on error (without throwErrors flag)", async () => {
    mockHttp.get.mockReturnValue(
      of({}).pipe(
        map(() => {
          throw new Error("test");
        }),
      ),
    );
    const entity = new Entity();
    entity["file"] = "file.name";

    const value: SafeUrl = await firstValueFrom(
      service.loadFile(entity, "file"),
    );

    expect(value).toEqual("");
  });
});
