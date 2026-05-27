import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ParsedFileInputComponent } from "./parsed-file-input.component";
import { Papa } from "ngx-papaparse";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Workbook } from "exceljs";

function mockFileEvent(mockFile: { name: string }): Event {
  return { target: { files: [mockFile] } } as unknown as Event;
}

describe("ParsedFileInputComponent", () => {
  let component: ParsedFileInputComponent;
  let fixture: ComponentFixture<ParsedFileInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ParsedFileInputComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParsedFileInputComponent<Object[]>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("fileType", "csv");
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only allow files that have a .csv extension when set to fileType csv", async () => {
    mockFileReader();

    await component.loadFile(mockFileEvent({ name: "wrong_extension.xlsx" }));
    expect(component.formControl.invalid).toBe(true);

    await component.loadFile(mockFileEvent({ name: "good_extension.csv" }));
    expect(component.formControl.valid).toBe(true);
  });

  it("should show error if file cannot be parsed", async () => {
    mockFileReader();
    const papa = TestBed.inject(Papa);
    vi.spyOn(papa, "parse").mockReturnValue(undefined);

    await component.loadFile(mockFileEvent({ name: "file.csv" }));
    expect(component.formControl.invalid).toBe(true);
  });

  it("should show error if file is empty", async () => {
    mockFileReader("");

    await component.loadFile(mockFileEvent({ name: "file.csv" }));
    expect(component.formControl.invalid).toBe(true);
  });

  it("keeps the parsed filename when switching xlsx sheets", async () => {
    setWorkbookWithSheets(component, [
      { name: "Children", rows: [["name"], ["John"]] },
      { name: "Schools", rows: [["name"], ["Govt School"]] },
    ]);
    component.parsedData = {
      data: [{ name: "John" }],
      fields: ["name"],
      filename: "children.xlsx",
    };
    const fileLoadSpy = vi.spyOn(component.fileLoad, "emit");

    await component.onSheetChange("Schools");

    expect(component.parsedData.filename).toBe("children.xlsx");
    expect(fileLoadSpy).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "children.xlsx" }),
    );
  });

  it("rejects empty sheets without emitting invalid parsed data", async () => {
    setWorkbookWithSheets(component, [
      { name: "Children", rows: [["name"], ["John"]] },
      { name: "Empty", rows: [["name"]] },
    ]);
    component.parsedData = {
      data: [{ name: "John" }],
      fields: ["name"],
      filename: "children.xlsx",
    };
    const fileLoadSpy = vi.spyOn(component.fileLoad, "emit");

    await component.onSheetChange("Empty");

    expect(component.formControl.errors).toEqual({
      parsingError: "File has no content",
    });
    expect(component.parsedData).toEqual({
      data: [{ name: "John" }],
      fields: ["name"],
      filename: "children.xlsx",
    });
    expect(fileLoadSpy).not.toHaveBeenCalled();
  });
});

function setWorkbookWithSheets(
  component: ParsedFileInputComponent,
  sheets: { name: string; rows: string[][] }[],
) {
  const workbook = new Workbook();
  for (const sheetDefinition of sheets) {
    const sheet = workbook.addWorksheet(sheetDefinition.name);
    for (const row of sheetDefinition.rows) {
      sheet.addRow(row);
    }
  }
  (
    component as unknown as { currentWorkbook: Workbook | null }
  ).currentWorkbook = workbook;
}

function mockFileReader(
  result = '_id,name,projectNumber\nChild:1,"John Doe",123',
) {
  vi.stubGlobal(
    "FileReader",
    class {
      result = result;
      addEventListener(_str: string, fun: () => any) {
        fun();
      }
      readAsText() {
        return undefined;
      }
    },
  );
}
