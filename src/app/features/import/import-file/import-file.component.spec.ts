import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportFileComponent } from "./import-file.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ParsedData } from "../../../core/input-file/input-file.component";

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
});
