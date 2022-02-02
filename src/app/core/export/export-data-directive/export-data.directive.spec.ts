import { ExportDataDirective } from "./export-data.directive";
import { DownloadDialogService } from "../download-dialog/download-dialog.service";

describe("ExportDataDirective", () => {
  let mockDownloadDialogService: jasmine.SpyObj<DownloadDialogService>;
  let directive: ExportDataDirective;

  beforeEach(() => {
    mockDownloadDialogService = jasmine.createSpyObj(["openDownloadDialog"]);
    directive = new ExportDataDirective(mockDownloadDialogService);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("opens should call openDownloadDialog when button is clicked", () => {
    directive.click();

    expect(mockDownloadDialogService.openDownloadDialog).toHaveBeenCalled();
  });
});
