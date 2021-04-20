import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { BackupService } from "../services/backup.service";
import { ExportDataComponent } from "./export-data.component";

describe("ExportDataComponent", () => {
  let component: ExportDataComponent;
  let fixture: ComponentFixture<ExportDataComponent>;
  let mockBackupService: jasmine.SpyObj<BackupService>;

  beforeEach(
    waitForAsync(() => {
      mockBackupService = jasmine.createSpyObj(["createJson", "createCsv"]);
      TestBed.configureTestingModule({
        declarations: [ExportDataComponent],
        providers: [{ provide: BackupService, useValue: mockBackupService }],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("opens download link when pressing button", () => {
    const link = document.createElement("a");
    const clickSpy = spyOn(link, "click");
    // Needed to later reset the createElement function, otherwise subsequent calls result in an error
    const oldCreateElement = document.createElement;
    document.createElement = jasmine
      .createSpy("HTML Element")
      .and.returnValue(link);
    const button = fixture.nativeElement.querySelector("button");

    expect(clickSpy.calls.count()).toBe(0);
    button.click();
    expect(clickSpy.calls.count()).toBe(1);
    // reset createElement otherwise results in: 'an Error was thrown after all'
    document.createElement = oldCreateElement;
  });
});
