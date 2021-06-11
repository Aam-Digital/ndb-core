import { ExportDataDirective } from "./export-data.directive";
import { BackupService } from "../services/backup.service";
import { TestBed, waitForAsync } from "@angular/core/testing";

describe("ExportDataDirective", () => {
  let mockBackupService: jasmine.SpyObj<BackupService>;
  let directive: ExportDataDirective;

  beforeEach(
    waitForAsync(() => {
      mockBackupService = jasmine.createSpyObj(["createJson", "createCsv"]);
      TestBed.configureTestingModule({
        declarations: [ExportDataDirective],
        providers: [{ provide: BackupService, useValue: mockBackupService }],
      }).compileComponents();
      directive = new ExportDataDirective(mockBackupService);
    })
  );

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("opens download link when pressing button", () => {
    const link = document.createElement("a");
    const clickSpy = spyOn(link, "click");
    // Needed to later reset the createElement function, otherwise subsequent calls result in an error
    const oldCreateElement = document.createElement;
    document.createElement = jasmine
      .createSpy("HTML Element")
      .and.returnValue(link);

    expect(clickSpy).not.toHaveBeenCalled();
    directive.click();
    expect(clickSpy).toHaveBeenCalled();
    // reset createElement otherwise results in: 'an Error was thrown after all'
    document.createElement = oldCreateElement;
  });
});
