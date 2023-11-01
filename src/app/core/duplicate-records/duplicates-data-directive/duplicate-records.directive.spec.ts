import { DuplicateRecordDirective } from "./duplicate-records.directive";
import { DuplicateRecordService } from "../duplicate-records.service";

describe("DuplicateRecordDirective", () => {
  let mockDuplicateRecord: jasmine.SpyObj<DuplicateRecordService>;
  let duplicateRecordDirective: DuplicateRecordDirective;

  beforeEach(() => {
    mockDuplicateRecord = jasmine.createSpyObj(["duplicateRecord"]);
    duplicateRecordDirective = new DuplicateRecordDirective(mockDuplicateRecord);
  });

  it("should create an instance DuplicateRecordDirective ", () => {
    expect(duplicateRecordDirective).toBeTruthy();
  });

  it("should call DuplicateRecord when button is clicked", () => {
    duplicateRecordDirective.click();

    expect(mockDuplicateRecord.duplicateRecord).toHaveBeenCalled();
  });
});
