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

  it("should ask the input-file to re-parse when the user changes the delimiter", () => {
    component.onFileLoad({ data: [{ x: 1 }], detectedDelimiter: "," });
    const reparseSpy = vi.spyOn(
      component.inputFileField,
      "reparseWithDelimiter",
    );

    component.onSeparatorChange(";");

    expect(component.selectedDelimiter()).toBe(";");
    expect(reparseSpy).toHaveBeenCalledWith(";");
  });

  it("should reset the selected delimiter to the new auto-detected value when another file is loaded", () => {
    component.onFileLoad({ data: [{ x: 1 }], detectedDelimiter: "," });
    component.onSeparatorChange(";");
    expect(component.selectedDelimiter()).toBe(";");

    component.onFileLoad({ data: [{ y: 2 }], detectedDelimiter: "," });

    expect(component.selectedDelimiter()).toBe(",");
  });
});
