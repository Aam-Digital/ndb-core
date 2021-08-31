import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { ExportService } from "../export-service/export.service";
import { ExportDataButtonComponent } from "./export-data-button.component";

describe("ExportDataComponent", () => {
  let component: ExportDataButtonComponent;
  let fixture: ComponentFixture<ExportDataButtonComponent>;
  let mockExportService: jasmine.SpyObj<ExportService>;

  beforeEach(
    waitForAsync(() => {
      mockExportService = jasmine.createSpyObj(["createJson", "createCsv"]);
      TestBed.configureTestingModule({
        declarations: [ExportDataButtonComponent],
        providers: [{ provide: ExportService, useValue: mockExportService }],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportDataButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("opens download link when pressing button", fakeAsync(() => {
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
    tick();
    expect(clickSpy.calls.count()).toBe(1);
    // reset createElement otherwise results in: 'an Error was thrown after all'
    document.createElement = oldCreateElement;
  }));
});
