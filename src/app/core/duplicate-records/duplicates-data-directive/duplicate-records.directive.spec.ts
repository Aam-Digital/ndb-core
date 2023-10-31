import { DuplicateRecordsDirective } from "./duplicate-records.directive";
import { DuplicateRecordsService } from "../duplicate-records.service";

describe("ExportDataDirective", () => {
  let mockDuplicateRecord: jasmine.SpyObj<DuplicateRecordsService>;
  let directive: DuplicateRecordsDirective;

  beforeEach(() => {
    mockDuplicateRecord = jasmine.createSpyObj(["getDataforDuplicate"]);
    directive = new DuplicateRecordsDirective(mockDuplicateRecord);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("should call DuplicateRecord when button is clicked", () => {
    directive.click();

    expect(mockDuplicateRecord.getDataforDuplicate).toHaveBeenCalled();
  });
});
