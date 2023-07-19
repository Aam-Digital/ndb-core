import { ExportDataDirective } from "./export-data.directive";
import { DownloadService } from "../download-service/download.service";

describe("ExportDataDirective", () => {
  let mockDownloadService: jasmine.SpyObj<DownloadService>;
  let directive: ExportDataDirective;

  beforeEach(() => {
    mockDownloadService = jasmine.createSpyObj(["triggerDownload"]);
    directive = new ExportDataDirective(mockDownloadService);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("opens should call triggerDownload when button is clicked", () => {
    directive.click();

    expect(mockDownloadService.triggerDownload).toHaveBeenCalled();
  });
});
