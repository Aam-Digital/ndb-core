import { TestBed } from "@angular/core/testing";
import { ExportDataDirective } from "./export-data.directive";
import { DownloadService } from "../download-service/download.service";

describe("ExportDataDirective", () => {
  let mockDownloadService: jasmine.SpyObj<DownloadService>;
  let directive: ExportDataDirective;

  beforeEach(() => {
    mockDownloadService = jasmine.createSpyObj(["triggerDownload"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: DownloadService, useValue: mockDownloadService },
      ],
    });
    directive = TestBed.inject(ExportDataDirective);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("should call triggerDownload when button is clicked", () => {
    directive.click();
    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  });
});
