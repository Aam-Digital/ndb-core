import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { InputFileComponent } from "./input-file.component";
import { Papa } from "ngx-papaparse";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

function mockFileEvent(mockFile: { name: string }): Event {
  return { target: { files: [mockFile] } } as unknown as Event;
}

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
    fixture.componentRef.setInput("fileType", "csv");
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

  it("should expose the auto-detected CSV delimiter in parsedData", async () => {
    mockFileReader("name,age\nAlice,30");
    await component.loadFile(mockFileEvent({ name: "file.csv" }));
    expect(component.parsedData.detectedDelimiter).toBe(",");

    mockFileReader("name;age\nAlice;30");
    await component.loadFile(mockFileEvent({ name: "file.csv" }));
    expect(component.parsedData.detectedDelimiter).toBe(";");
  });

  it("should re-parse with explicit delimiter when auto-detection picks wrong", async () => {
    // file uses ; but we'll force re-parse with that delimiter
    mockFileReader("name;age\nAlice;30");

    await component.loadFile(mockFileEvent({ name: "file.csv" }));
    component.reparseWithDelimiter(";");

    expect(component.parsedData.detectedDelimiter).toBe(";");
    expect(component.parsedData.fields).toEqual(["name", "age"]);
    expect(component.parsedData.data).toEqual([{ name: "Alice", age: 30 }]);
  });

  it("should ignore reparse before any file has been loaded", () => {
    expect(component.parsedData).toBeUndefined();

    component.reparseWithDelimiter(";");

    expect(component.parsedData).toBeUndefined();
  });
});

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
