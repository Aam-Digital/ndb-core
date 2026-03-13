import { TestBed } from "@angular/core/testing";
import { ExportDataDirective } from "./export-data.directive";
import { DownloadService } from "../download-service/download.service";

describe("ExportDataDirective", () => {
  let mockDownloadService: any;
  let directive: ExportDataDirective;

  beforeEach(() => {
    mockDownloadService = {
      triggerDownload: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: DownloadService, useValue: mockDownloadService },
        ExportDataDirective,
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
