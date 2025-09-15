import { TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";

import { TemplateExportService } from "./template-export.service";
import { MatDialog } from "@angular/material/dialog";
import { TemplateExportSelectionDialogComponent } from "../template-export-selection-dialog/template-export-selection-dialog.component";
import { HttpClient } from "@angular/common/http";
import { environment } from "#src/environments/environment";

describe("TemplateExportService", () => {
  let service: TemplateExportService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  const baseUrl = environment.API_PROXY_PREFIX + "/actuator/features";

  beforeEach(() => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockHttpClient = jasmine.createSpyObj("HttpClient", [
      "get",
      "post",
      "delete",
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    service = TestBed.inject(TemplateExportService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should open dialog with given entity", async () => {
    const data = {};
    const result = await service.generateFile(data);

    expect(mockDialog.open).toHaveBeenCalledWith(
      TemplateExportSelectionDialogComponent,
      jasmine.objectContaining({ data: data }),
    );
    expect(result).toBeTrue();
  });

  it("should return true when API is reachable and export feature flag is enabled", async () => {
    const mockResponse = {
      export: { enabled: true },
      notification: { enabled: false },
    };
    mockHttpClient.get.and.returnValue(of(mockResponse));

    const result = await service.isExportServerEnabled();
    expect(mockHttpClient.get).toHaveBeenCalledWith(baseUrl);
    expect(result).toBe(true);
  });

  it("should return false when API is reachable and export feature flag is disabled", async () => {
    const mockResponse = {
      export: { enabled: false },
      notification: { enabled: true },
    };
    mockHttpClient.get.and.returnValue(of(mockResponse));

    const result = await service.isExportServerEnabled();
    expect(mockHttpClient.get).toHaveBeenCalledWith(baseUrl);
    expect(result).toBe(false);
  });

  it("should return false when API is reachable but export feature is not mentioned in response", async () => {
    const mockResponse = {
      notification: { enabled: true },
      health: { enabled: true },
    };
    mockHttpClient.get.and.returnValue(of(mockResponse));

    const result = await service.isExportServerEnabled();
    expect(mockHttpClient.get).toHaveBeenCalledWith(baseUrl);
    expect(result).toBe(false);
  });

  it("should return false when API is not reachable (504 Gateway Timeout)", async () => {
    const errorResponse = new HttpErrorResponse({
      error: "Gateway Timeout",
      status: 504,
      statusText: "Gateway Timeout",
    });
    mockHttpClient.get.and.returnValue(throwError(() => errorResponse));

    const result = await service.isExportServerEnabled();
    expect(mockHttpClient.get).toHaveBeenCalledWith(baseUrl);
    expect(result).toBe(false);
  });
});
