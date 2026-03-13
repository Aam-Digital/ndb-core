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
    component.fileType = "csv";
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
      readAsText() {}
    },
  );
}
