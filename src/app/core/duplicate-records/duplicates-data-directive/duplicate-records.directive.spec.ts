import { DuplicateRecordDirective } from "./duplicate-records.directive";
import { DuplicateRecordService } from "../duplicate-records.service";

describe("ExportDataDirective", () => {
  let mockDuplicateRecord: jasmine.SpyObj<DuplicateRecordService>;
  let directive: DuplicateRecordDirective;

  beforeEach(() => {
    mockDuplicateRecord = jasmine.createSpyObj(["duplicateRecord"]);
    directive = new DuplicateRecordDirective(mockDuplicateRecord);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("should call DuplicateRecord when button is clicked", () => {
    directive.click();

    expect(mockDuplicateRecord.duplicateRecord).toHaveBeenCalled();
  });
});
