import { TestBed } from "@angular/core/testing";

import { DownloadDialogService } from "./download-dialog.service";
import { ExportService } from "../export-service/export.service";

describe("DownloadDialogService", () => {
  let service: DownloadDialogService;
  let mockExportService: jasmine.SpyObj<ExportService>;

  beforeEach(() => {
    mockExportService = jasmine.createSpyObj(["createJson", "createCsv"]);
    TestBed.configureTestingModule({
      providers: [
        DownloadDialogService,
        { provide: ExportService, useValue: mockExportService },
      ],
    });
    service = TestBed.inject(DownloadDialogService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("opens download link when pressing button", async () => {
    const link = document.createElement("a");
    const clickSpy = spyOn(link, "click");
    // Needed to later reset the createElement function, otherwise subsequent calls result in an error
    const oldCreateElement = document.createElement;
    document.createElement = jasmine
      .createSpy("HTML Element")
      .and.returnValue(link);

    expect(clickSpy).not.toHaveBeenCalled();
    await service.openDownloadDialog([], "csv", "someFileName");
    expect(clickSpy).toHaveBeenCalled();
    // reset createElement otherwise results in: 'an Error was thrown after all'
    document.createElement = oldCreateElement;
  });
});
