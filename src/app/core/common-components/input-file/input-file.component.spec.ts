import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { InputFileComponent } from "./input-file.component";
import { Papa } from "ngx-papaparse";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import {
  SINGLE_SHEET_XLSX_B64,
  MULTI_SHEET_XLSX_B64,
} from "./input-file.test-fixtures";

function mockFileEvent(mockFile: { name: string }): Event {
  return { target: { files: [mockFile] } } as unknown as Event;
}

function base64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}

// exceljs's stream pipeline (PassThrough → StreamBuf) emits Uint8Array chunks
// that fail its `Buffer.isBuffer(chunk)` check in jsdom, producing unhandled
// rejections that fail vitest in CI even though the workbook still loads. The
// real browser path doesn't hit this code, so we filter the specific message.
process.prependListener("unhandledRejection", (reason: unknown) => {
  const message =
    reason instanceof Error ? reason.message : String(reason ?? "");
  if (message.includes("Chunk must be one of type")) {
    // swallow
  } else {
    throw reason;
  }
});

describe("InputFileComponent", () => {
  let component: InputFileComponent;
  let fixture: ComponentFixture<InputFileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [InputFileComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputFileComponent<Object[]>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("fileType", ["csv"]);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only allow files that have a .csv extension when set to fileType csv", async () => {
    mockTextFileReader();

    await component.loadFile(mockFileEvent({ name: "wrong_extension.xlsx" }));
    expect(component.formControl.invalid).toBe(true);

    await component.loadFile(mockFileEvent({ name: "good_extension.csv" }));
    expect(component.formControl.valid).toBe(true);
  });

  it("should show error if file cannot be parsed", async () => {
    mockTextFileReader();
    const papa = TestBed.inject(Papa);
    vi.spyOn(papa, "parse").mockReturnValue(undefined);

    await component.loadFile(mockFileEvent({ name: "file.csv" }));
    expect(component.formControl.invalid).toBe(true);
  });

  it("should show error if file is empty", async () => {
    mockTextFileReader("");

    await component.loadFile(mockFileEvent({ name: "file.csv" }));
    expect(component.formControl.invalid).toBe(true);
  });

  describe("xlsx parsing", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("fileType", ["csv", "xlsx"]);
      fixture.detectChanges();
    });

    it("should reject xlsx files when fileType only allows csv", async () => {
      fixture.componentRef.setInput("fileType", ["csv"]);
      fixture.detectChanges();

      mockArrayBufferFileReader(base64ToBuffer(SINGLE_SHEET_XLSX_B64));

      await component.loadFile(mockFileEvent({ name: "data.xlsx" }));
      expect(component.formControl.invalid).toBe(true);
    });

    it("should parse a single-sheet xlsx and emit ParsedData", async () => {
      mockArrayBufferFileReader(base64ToBuffer(SINGLE_SHEET_XLSX_B64));

      let emitted: any;
      component.fileLoad.subscribe((d) => (emitted = d));

      await component.loadFile(mockFileEvent({ name: "data.xlsx" }));

      expect(component.formControl.valid).toBe(true);
      expect(emitted.data).toEqual([
        { _id: "Child:1", name: "John Doe", projectNumber: 123 },
      ]);
      expect(emitted.fields).toEqual(["_id", "name", "projectNumber"]);
      expect(emitted.filename).toBe("data.xlsx");
    });

    it("should not show sheet picker for single-sheet xlsx", async () => {
      mockArrayBufferFileReader(base64ToBuffer(SINGLE_SHEET_XLSX_B64));

      await component.loadFile(mockFileEvent({ name: "data.xlsx" }));

      expect(component.availableSheets()).toEqual([]);
    });

    it("should expose available sheets with row and column counts for multi-sheet xlsx", async () => {
      mockArrayBufferFileReader(base64ToBuffer(MULTI_SHEET_XLSX_B64));

      await component.loadFile(mockFileEvent({ name: "data.xlsx" }));

      expect(component.availableSheets()).toEqual([
        { name: "Grade 6", rowCount: 1, columnCount: 3 },
        { name: "Grade 7", rowCount: 2, columnCount: 3 },
      ]);
      expect(component.selectedSheet()).toBe("Grade 6");
    });

    it("should default to first sheet and emit its data for multi-sheet xlsx", async () => {
      mockArrayBufferFileReader(base64ToBuffer(MULTI_SHEET_XLSX_B64));

      let emitted: any;
      component.fileLoad.subscribe((d) => (emitted = d));

      await component.loadFile(mockFileEvent({ name: "data.xlsx" }));

      expect(emitted.data).toEqual([{ name: "Alice", age: 6, grade: "A" }]);
    });

    it("should re-emit data when sheet is changed", async () => {
      mockArrayBufferFileReader(base64ToBuffer(MULTI_SHEET_XLSX_B64));

      const emitted: any[] = [];
      component.fileLoad.subscribe((d) => emitted.push(d));

      await component.loadFile(mockFileEvent({ name: "data.xlsx" }));
      await component.onSheetChange("Grade 7");

      expect(component.selectedSheet()).toBe("Grade 7");
      expect(emitted.at(-1).data).toEqual([
        { name: "Bob", age: 7, grade: "B" },
        { name: "Carol", age: 7, grade: "C" },
      ]);
    });

    it("should clear sheet picker state when a non-xlsx file is loaded after an xlsx", async () => {
      mockArrayBufferFileReader(base64ToBuffer(MULTI_SHEET_XLSX_B64));
      await component.loadFile(mockFileEvent({ name: "data.xlsx" }));
      expect(component.availableSheets().length).toBe(2);

      mockTextFileReader();
      await component.loadFile(mockFileEvent({ name: "follow-up.csv" }));

      expect(component.availableSheets()).toEqual([]);
      expect(component.selectedSheet()).toBeNull();
    });
  });
});

function mockTextFileReader(
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
      readAsArrayBuffer() {
        return undefined;
      }
    },
  );
}

function mockArrayBufferFileReader(result: ArrayBuffer | Buffer) {
  vi.stubGlobal(
    "FileReader",
    class {
      result = result;
      addEventListener(_str: string, fun: () => any) {
        fun();
      }
      readAsArrayBuffer() {
        return undefined;
      }
      readAsText() {
        return undefined;
      }
    },
  );
}
