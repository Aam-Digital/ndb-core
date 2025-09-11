import { TestBed } from "@angular/core/testing";

import { TemplateExportService } from "./template-export.service";
import { MatDialog } from "@angular/material/dialog";
import { TemplateExportSelectionDialogComponent } from "../template-export-selection-dialog/template-export-selection-dialog.component";
import { HttpClient } from "@angular/common/http";

describe("TemplateExportService", () => {
  let service: TemplateExportService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockHttpClient = jasmine.createSpyObj(["get", "post", "delete"]);

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
});
