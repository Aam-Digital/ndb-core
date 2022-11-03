import { TestBed } from "@angular/core/testing";

import { FileService } from "./file.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpResponse,
} from "@angular/common/http";
import { AlertService } from "../alerts/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { of, Subject, throwError } from "rxjs";
import { ShowFileComponent } from "./show-file/show-file.component";

describe("FileService", () => {
  let service: FileService;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  let mockAlerts: jasmine.SpyObj<AlertService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    mockHttp = jasmine.createSpyObj(["get", "put", "delete"]);
    mockAlerts = jasmine.createSpyObj(["addProgress", "removeAlert"]);
    mockDialog = jasmine.createSpyObj(["open"]);
    TestBed.configureTestingModule({
      providers: [
        FileService,
        { provide: HttpClient, useValue: mockHttp },
        {
          provide: AlertService,
          useValue: mockAlerts,
        },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });
    service = TestBed.inject(FileService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add a attachment to a existing document", (done) => {
    mockHttp.get.and.returnValue(of({ _rev: "test_rev" }));
    mockHttp.put.and.returnValue(of({ ok: true }));
    const file = { type: "image/png" } as File;

    service.uploadFile(file, "testId", "testProp").subscribe(() => {
      expect(mockHttp.get).toHaveBeenCalledWith(
        jasmine.stringContaining("/testId")
      );
      expect(mockHttp.put).toHaveBeenCalledWith(
        jasmine.stringContaining("/testId/testProp?rev=test_rev"),
        jasmine.anything(),
        jasmine.anything()
      );
      done();
    });
  });

  it("should create attachment document if it does not exist yet", (done) => {
    mockHttp.get.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );
    mockHttp.put.and.returnValue(of({ rev: "newRev" }));
    const file = { type: "image/png" } as File;

    service.uploadFile(file, "testId", "testProp").subscribe(() => {
      expect(mockHttp.put).toHaveBeenCalledWith(
        jasmine.stringContaining("/testId"),
        {}
      );
      expect(mockHttp.put).toHaveBeenCalledWith(
        jasmine.stringContaining("/testId/testProp?rev=newRev"),
        jasmine.anything(),
        jasmine.anything()
      );
      done();
    });
  });

  it("should forward any other errors", (done) => {
    mockHttp.get.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
    );

    const file = { type: "image/png" } as File;

    service.uploadFile(file, "testId", "testProp").subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(HttpErrorResponse);
        expect(err.status).toBe(401);
        done();
      },
    });
  });

  it("should remove a file using the latest rev", (done) => {
    mockHttp.get.and.returnValue(of({ _rev: "test_rev" }));
    mockHttp.delete.and.returnValue(of({ ok: true }));

    service.removeFile("testId", "testProp").subscribe(() => {
      expect(mockHttp.get).toHaveBeenCalledWith(
        jasmine.stringContaining("/testId")
      );
      expect(mockHttp.delete).toHaveBeenCalledWith(
        jasmine.stringContaining("/testId/testProp?rev=test_rev")
      );
      done();
    });
  });

  it("should show progress while downloading a file", () => {
    const events = new Subject<HttpEvent<Blob>>();
    spyOn(URL, "createObjectURL");
    spyOn(window, "open");
    mockHttp.get.and.returnValue(events);

    service.showFile("testId", "testProp");

    expect(mockAlerts.addProgress).toHaveBeenCalled();

    events.next({ type: HttpEventType.DownloadProgress, loaded: 1, total: 10 });
    expect(mockAlerts.removeAlert).not.toHaveBeenCalled();

    events.next({ type: HttpEventType.Response } as HttpResponse<any>);
    expect(mockAlerts.removeAlert).toHaveBeenCalled();
  });

  it("should show a dialog if the popup couldn't be opened", () => {
    mockHttp.get.and.returnValue(of({ type: HttpEventType.Response }));
    spyOn(URL, "createObjectURL").and.returnValue("dataUrl");
    // no return value means popup couldn't be opened
    spyOn(window, "open");

    service.showFile("testId", "testProp");

    expect(mockDialog.open).toHaveBeenCalledWith(ShowFileComponent, {
      data: "dataUrl",
    });
  });
});
