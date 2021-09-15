import { TestBed, waitForAsync } from "@angular/core/testing";
import { ExportService } from "../export-service/export.service";
import { ExportDataDirective } from "./export-data.directive";

describe("ExportDataDirective", () => {
  let mockBackupService: jasmine.SpyObj<ExportService>;
  let directive: ExportDataDirective;

  beforeEach(
    waitForAsync(() => {
      mockBackupService = jasmine.createSpyObj(["createJson", "createCsv"]);
      TestBed.configureTestingModule({
        declarations: [ExportDataDirective],
        providers: [{ provide: ExportService, useValue: mockBackupService }],
      }).compileComponents();
      directive = new ExportDataDirective(mockBackupService);
    })
  );

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("opens download link when pressing button", async () => {
    const link = document.createElement("a");
    const clickSpy = spyOn(link, "click");
    // Needed to later reset the createElement function, otherwise subsequent calls result in an error
    const oldCreateElement = document.createElement;
    document.createElement = jasmine
      .createSpy("HTML Element")
      .and.returnValue(link);

    expect(clickSpy).not.toHaveBeenCalled();
    await directive.click();
    expect(clickSpy).toHaveBeenCalled();
    // reset createElement otherwise results in: 'an Error was thrown after all'
    document.createElement = oldCreateElement;
  });
});
