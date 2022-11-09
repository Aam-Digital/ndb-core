import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { CouchdbFileService } from "./couchdb-file.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from "@angular/common/http";
import { MatDialog } from "@angular/material/dialog";
import { of, Subject, throwError } from "rxjs";
import { ShowFileComponent } from "./show-file/show-file.component";
import { Entity } from "../entity/model/entity";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { MatSnackBar } from "@angular/material/snack-bar";

describe("CouchdbFileService", () => {
  let service: CouchdbFileService;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockSnackbar: jasmine.SpyObj<MatSnackBar>;
  let dismiss: jasmine.Spy;

  beforeEach(() => {
    mockHttp = jasmine.createSpyObj(["get", "put", "delete"]);
    mockDialog = jasmine.createSpyObj(["open"]);
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    mockSnackbar = jasmine.createSpyObj(["openFromComponent"]);
    dismiss = jasmine.createSpy();
    mockSnackbar.openFromComponent.and.returnValue({ dismiss } as any);

    TestBed.configureTestingModule({
      providers: [
        CouchdbFileService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: MatSnackBar, useValue: mockSnackbar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
    service = TestBed.inject(CouchdbFileService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add a attachment to a existing document and update the entity", fakeAsync(() => {
    mockHttp.get.and.returnValue(of({ _rev: "test_rev" }));
    mockHttp.put.and.returnValue(of({ ok: true }));
    const file = { type: "image/png", name: "file.name" } as File;
    const entity = new Entity("testId");

    service.uploadFile(file, entity, "testProp").subscribe();
    tick();

    expect(mockHttp.get).toHaveBeenCalledWith(
      jasmine.stringContaining("/Entity:testId")
    );
    expect(mockHttp.put).toHaveBeenCalledWith(
      jasmine.stringContaining("/Entity:testId/testProp?rev=test_rev"),
      jasmine.anything(),
      jasmine.anything()
    );
    expect(entity["testProp"]).toBe("file.name");
    expect(mockEntityMapper.save).toHaveBeenCalledWith(entity);
  }));

  it("should create attachment document if it does not exist yet", (done) => {
    mockHttp.get.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );
    mockHttp.put.and.returnValue(of({ rev: "newRev" }));
    const file = { type: "image/png", name: "file.name" } as File;
    const entity = new Entity("testId");

    service.uploadFile(file, entity, "testProp").subscribe(() => {
      expect(mockHttp.put).toHaveBeenCalledWith(
        jasmine.stringContaining("/Entity:testId"),
        {}
      );
      expect(mockHttp.put).toHaveBeenCalledWith(
        jasmine.stringContaining("/Entity:testId/testProp?rev=newRev"),
        jasmine.anything(),
        jasmine.anything()
      );
      expect(entity["testProp"]).toBe("file.name");
      expect(mockEntityMapper.save).toHaveBeenCalledWith(entity);
      done();
    });
  });

  it("should forward any other errors", (done) => {
    mockHttp.get.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
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

  it("should remove a file using the latest rev and update the entity", fakeAsync(() => {
    mockHttp.get.and.returnValue(of({ _rev: "test_rev" }));
    mockHttp.delete.and.returnValue(of({ ok: true }));
    const entity = new Entity("testId");
    const prop = "testProp";
    entity[prop] = "test.file";

    service.removeFile(entity, "testProp").subscribe();
    tick();

    expect(mockHttp.get).toHaveBeenCalledWith(
      jasmine.stringContaining("/Entity:testId")
    );
    expect(mockHttp.delete).toHaveBeenCalledWith(
      jasmine.stringContaining("/Entity:testId/testProp?rev=test_rev")
    );
    expect(entity[prop]).toBe(undefined);
    expect(mockEntityMapper.save).toHaveBeenCalledWith(entity);
  }));

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
});
