import { DuplicateRecordsDirective } from "./duplicate-records.directive";
import { DuplicateRecordService } from "../duplicate-records.service";

describe("ExportDataDirective", () => {
  let mockDuplicateRecord: jasmine.SpyObj<DuplicateRecordService>;
  let directive: DuplicateRecordsDirective;

  beforeEach(() => {
    mockDuplicateRecord = jasmine.createSpyObj(["duplicateRecord"]);
    directive = new DuplicateRecordsDirective(mockDuplicateRecord);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("should call DuplicateRecord when button is clicked", () => {
    directive.click();

    expect(mockDuplicateRecord.duplicateRecord).toHaveBeenCalled();
  });
});
