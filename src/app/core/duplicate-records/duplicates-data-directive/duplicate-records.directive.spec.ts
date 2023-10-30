import { DuplicateRecordsDirective } from "./duplicate-records.directive";
import { DuplicateRecordsService } from "../duplicate-records.service";

describe("ExportDataDirective", () => {
  let mockDownloadService: jasmine.SpyObj<DuplicateRecordsService>;
  let directive: DuplicateRecordsDirective;

  beforeEach(() => {
    mockDownloadService = jasmine.createSpyObj(["getDataforDuplicate"]);
    directive = new DuplicateRecordsDirective(mockDownloadService);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("opens should call triggerDownload when button is clicked", () => {
    directive.click();

    expect(mockDownloadService.getDataforDuplicate).toHaveBeenCalled();
  });
});
