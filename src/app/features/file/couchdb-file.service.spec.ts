import { fakeAsync, TestBed, tick } from "@angular/core/testing";

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

describe("CouchdbFileService", () => {
  let service: CouchdbFileService;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackbar: jasmine.SpyObj<MatSnackBar>;
  let dismiss: jasmine.Spy;
  let updates: Subject<UpdatedEntity<Entity>>;
  const attachmentUrlPrefix = `${environment.DB_PROXY_PREFIX}/${Entity.DATABASE}-attachments`;
  let mockNavigator;

  beforeEach(() => {
    mockHttp = jasmine.createSpyObj(["get", "put", "delete"]);
    mockDialog = jasmine.createSpyObj(["open"]);
    updates = new Subject();
    mockSnackbar = jasmine.createSpyObj(["openFromComponent"]);
    dismiss = jasmine.createSpy();
    mockSnackbar.openFromComponent.and.returnValue({ dismiss } as any);
    Entity.schema.set("testProp", {
      dataType: FileDatatype.dataType,
    });
    let mockDb = jasmine.createSpyObj(["sync"]);
    mockDb.sync.and.resolveTo(null);
    mockNavigator = { onLine: true };

    TestBed.configureTestingModule({
      providers: [
        CouchdbFileService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: MatSnackBar, useValue: mockSnackbar },
        { provide: MatDialog, useValue: mockDialog },
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
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add a attachment to a existing document", fakeAsync(() => {
    mockHttp.get.and.returnValue(of({ _rev: "test_rev" }));
    mockHttp.put.and.returnValue(of({ ok: true }));
    const file = new File([], "file.name", { type: "image/png" });
    const entity = new Entity("testId");

    service.uploadFile(file, entity, "testProp").subscribe();
    tick();

    expect(mockHttp.get).toHaveBeenCalledWith(
      jasmine.stringContaining(`${attachmentUrlPrefix}/Entity:testId`),
    );
    expect(mockHttp.put).toHaveBeenCalledWith(
      jasmine.stringContaining(
        `${attachmentUrlPrefix}/Entity:testId/testProp?rev=test_rev`,
      ),
      jasmine.anything(),
      jasmine.anything(),
    );
  }));

  it("should create attachment document if it does not exist yet (and complete a sync first)", (done) => {
    mockHttp.get.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    mockHttp.put.and.returnValue(of({ rev: "newRev" }));
    const file = new File([], "file.name", { type: "image/png" });
    const entity = new Entity("testId");

    service.uploadFile(file, entity, "testProp").subscribe(() => {
      // newly created entity has to be synced to server db for permission checks of attachment upload
      expect(
        (
          TestBed.inject(
            DatabaseResolverService,
          ).getDatabase() as SyncedPouchDatabase
        ).sync,
      ).toHaveBeenCalled();

      expect(mockHttp.put).toHaveBeenCalledWith(
        jasmine.stringContaining(`${attachmentUrlPrefix}/Entity:testId`),
        {},
      );
      expect(mockHttp.put).toHaveBeenCalledWith(
        jasmine.stringContaining(
          `${attachmentUrlPrefix}/Entity:testId/testProp?rev=newRev`,
        ),
        jasmine.anything(),
        jasmine.anything(),
      );
      done();
    });
  });

  it("should forward any other errors", (done) => {
    mockHttp.get.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    const file = { type: "image/png" } as File;

    service.uploadFile(file, new Entity("testId"), "testProp").subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(HttpErrorResponse);
        expect(err.status).toBe(401);
        done();
      },
    });
  });

  it("should throw NotAvailableOffline error for uploadFile if offline (and not make requests)", (done) => {
    mockNavigator.onLine = false;

    service.uploadFile(null, new Entity("testId"), "testProp").subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(NotAvailableOfflineError);
        expect(mockHttp.put).not.toHaveBeenCalled();
        done();
      },
    });
  });
  it("should throw NotAvailableOffline error for removeFile if offline (and not make requests)", (done) => {
    mockNavigator.onLine = false;

    service.removeFile(new Entity("testId"), "testProp").subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(NotAvailableOfflineError);
        expect(mockHttp.delete).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it("should remove a file using the latest rev", () => {
    mockHttp.get.and.returnValue(of({ _rev: "test_rev" }));
    mockHttp.delete.and.returnValue(of({ ok: true }));
    const entity = new Entity("testId");

    service.removeFile(entity, "testProp").subscribe();

    expect(mockHttp.get).toHaveBeenCalledWith(
      jasmine.stringContaining(`${attachmentUrlPrefix}/Entity:testId`),
    );
    expect(mockHttp.delete).toHaveBeenCalledWith(
      jasmine.stringContaining(
        `${attachmentUrlPrefix}/Entity:testId/testProp?rev=test_rev`,
      ),
    );
  });

  it("should show progress while downloading a file", () => {
    const events = new Subject<HttpEvent<Blob>>();
    spyOn(URL, "createObjectURL");
    spyOn(window, "open");
    mockHttp.get.and.returnValue(events);

    service.showFile(new Entity("testId"), "testProp");

    expect(mockSnackbar.openFromComponent).toHaveBeenCalled();
    // Code is only executed if observable is subscribed
    const data: any =
      mockSnackbar.openFromComponent.calls.mostRecent().args[1].data;
    data.progress.subscribe();

    events.next({ type: HttpEventType.DownloadProgress, loaded: 1, total: 10 });
    expect(dismiss).not.toHaveBeenCalled();

    events.complete();
    expect(dismiss).toHaveBeenCalled();
  });

  it("should show a dialog if the popup couldn't be opened", () => {
    mockHttp.get.and.returnValue(of({ type: HttpEventType.Response }));
    spyOn(URL, "createObjectURL").and.returnValue("dataUrl");
    // no return value means popup couldn't be opened
    spyOn(window, "open");

    service.showFile(new Entity("testId"), "testProp");

    expect(mockDialog.open).toHaveBeenCalledWith(ShowFileComponent, {
      data: "dataUrl",
    });
  });

  it("should delete files document if a entity is deleted", fakeAsync(() => {
    const entity = new Entity();
    mockHttp.get.and.returnValue(of({ _rev: "someRev" }));
    mockHttp.delete.and.returnValue(EMPTY);

    updates.next({ entity, type: "remove" });
    tick();

    expect(mockHttp.get).toHaveBeenCalledWith(
      jasmine.stringContaining(entity.getId()),
    );
    expect(mockHttp.delete).toHaveBeenCalledWith(
      jasmine.stringContaining(`/${entity.getId()}?rev=someRev`),
    );
  }));

  it("should not fail if to-be-removed file reference could not be found", () => {
    mockHttp.get.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: HttpStatusCode.NotFound }),
      ),
    );

    return expectAsync(
      firstValueFrom(service.removeFile(new Entity(), "testProp")),
    ).toBeResolved();
  });

  it("should wait for previous request to finish before starting a new one", fakeAsync(() => {
    const firstPut = new BehaviorSubject({ ok: true });
    const secondPut = new BehaviorSubject({ ok: true });
    const thirdPut = new BehaviorSubject({ ok: true });
    const file1 = new File([], "file1.name", { type: "image/png" });
    const file2 = new File([], "file2.name", { type: "image/png" });
    const file3 = new File([], "file3.name", { type: "image/png" });
    const entity = new Entity("testId");
    mockHttp.get.and.returnValues(
      of({ _rev: "1-rev" }),
      of({ _rev: "2-rev" }),
      of({ _rev: "3-rev" }),
    );
    mockHttp.put.and.returnValues(firstPut, secondPut, thirdPut);

    let file1Done = false;
    let file2Done = false;
    let file3Done = false;
    service
      .uploadFile(file1, entity, "prop1")
      .subscribe({ complete: () => (file1Done = true) });
    tick();
    service
      .uploadFile(file2, entity, "prop2")
      .subscribe({ complete: () => (file2Done = true) });
    tick();
    service
      .uploadFile(file3, entity, "prop3")
      .subscribe({ complete: () => (file3Done = true) });
    tick();

    expect(firstPut.observed).toBeTrue();
    expect(secondPut.observed).toBeFalse();
    expect(mockHttp.put).toHaveBeenCalledTimes(1);
    expect(mockHttp.put).toHaveBeenCalledWith(
      jasmine.stringContaining(
        `${attachmentUrlPrefix}/Entity:testId/prop1?rev=1-rev`,
      ),
      jasmine.anything(),
      jasmine.anything(),
    );

    firstPut.complete();
    tick();

    expect(file1Done).toBeTrue();
    expect(file2Done).toBeFalse();
    expect(file3Done).toBeFalse();
    expect(secondPut.observed).toBeTrue();
    expect(thirdPut.observed).toBeFalse();
    expect(mockHttp.put).toHaveBeenCalledTimes(2);
    expect(mockHttp.put).toHaveBeenCalledWith(
      jasmine.stringContaining(
        `${attachmentUrlPrefix}/Entity:testId/prop2?rev=2-rev`,
      ),
      jasmine.anything(),
      jasmine.anything(),
    );

    secondPut.complete();
    tick();

    expect(file2Done).toBeTrue();
    expect(file3Done).toBeFalse();
    expect(thirdPut.observed).toBeTrue();
    expect(mockHttp.put).toHaveBeenCalledTimes(3);
    expect(mockHttp.put).toHaveBeenCalledWith(
      jasmine.stringContaining(
        `${attachmentUrlPrefix}/Entity:testId/prop3?rev=3-rev`,
      ),
      jasmine.anything(),
      jasmine.anything(),
    );
  }));

  it("should only request a file once per session", async () => {
    mockHttp.get.and.returnValue(of(new Blob([])));
    const entity = new Entity();
    entity["file"] = "file.name";

    const first = await firstValueFrom(service.loadFile(entity, "file"));

    expect(mockHttp.get).toHaveBeenCalled();

    mockHttp.get.calls.reset();
    const second = await firstValueFrom(service.loadFile(entity, "file"));

    expect(first).toEqual(second);
    expect(mockHttp.get).not.toHaveBeenCalled();

    URL.revokeObjectURL(second as string);
  });

  it("should cache uploaded files", () => {
    const file = new File([], "file.name", { type: "image/png" });
    const entity = new Entity("testId");
    mockHttp.get.and.returnValue(of({ _rev: "1-rev" }));
    mockHttp.put.and.returnValue(of({ type: HttpEventType.Response }));
    service.uploadFile(file, entity, "testProp").subscribe();
    mockHttp.get.calls.reset();

    service.loadFile(entity, "testProp").subscribe();

    expect(mockHttp.get).not.toHaveBeenCalled();
  });

  it("should return empty blob on error (without throwErrors flag)", async () => {
    mockHttp.get.and.returnValue(
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
