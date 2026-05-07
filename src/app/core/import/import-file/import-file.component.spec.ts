import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportFileComponent } from "./import-file.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ParsedData } from "../../common-components/input-file/input-file.component";

describe("ImportSelectFileComponent", () => {
  let component: ImportFileComponent;
  let fixture: ComponentFixture<ImportFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportFileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should store loaded data for UI use", () => {
    const testData: ParsedData<any> = { data: [{ x: 1 }, { x: 2 }] };

    component.onFileLoad(testData);

    expect(component.data).toEqual(testData);
  });

  it("should reset all state", () => {
    component.data = { data: [{ x: 1 }, { x: 2 }] };
    component.inputFileField.formControl.setValue("test");

    component.reset();

    expect(component.data).toBeUndefined();
    expect(component.inputFileField.formControl.getRawValue()).toEqual(null);
  });

  it("should handle parsed CSV data with auto-detected separators", () => {
    const testData: ParsedData<any> = {
      data: [{ name: "Tabby", items: "item1;item2;item3" }],
      detectedDelimiter: ";",
    };
    component.onFileLoad(testData);
    expect(component.data).toEqual(testData);
  });

  it("should pass through detected delimiter from PapaParse", () => {
    const testData: ParsedData<any> = {
      data: [{ name: "John", age: 30 }],
      fields: ["name", "age"],
      detectedDelimiter: "|",
      filename: "test.csv",
    };
    component.onFileLoad(testData);
    expect(component.data.detectedDelimiter).toBe("|");
  });
});
