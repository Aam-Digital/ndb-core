import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditDateFormatComponent } from "./edit-date-format.component";
import { FormControl } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  convertToMomentFormat,
  datepickerFormat,
  defaultDateFormat,
  defaultDateTimeFormat,
  setGlobalDateFormat,
} from "../date.static";

describe("EditDateFormatComponent", () => {
  let component: EditDateFormatComponent;
  let fixture: ComponentFixture<EditDateFormatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDateFormatComponent, MatFormFieldModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDateFormatComponent);
    component = fixture.componentInstance;
    component.ngControl = {
      control: new FormControl(""),
    } as any;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should return predefined formats when value is empty", () => {
    expect(component.formatOptions()).toEqual(component.predefinedFormats);
  });

  it("should include custom format in options when set", () => {
    const customFormat = "mm-dd-yyyy";
    component.formControl.setValue(customFormat);
    fixture.detectChanges();
    expect(component.formatOptions()).toContain(customFormat);
    expect(component.formatOptions().length).toBe(
      component.predefinedFormats.length + 1,
    );
  });

  it("should not duplicate a predefined format in options", () => {
    component.formControl.setValue("dd.MM.yyyy");
    fixture.detectChanges();
    const count = component
      .formatOptions()
      .filter((f) => f === "dd.MM.yyyy").length;
    expect(count).toBe(1);
  });

  it("should trim whitespace in createCustomFormat", async () => {
    const result = await component.createCustomFormat("  MM/dd/yyyy  ");
    expect(result).toBe("MM/dd/yyyy");
  });

  it("formatOptionToString should include an example date in the label", () => {
    const label = component.formatOptionToString("dd.MM.yyyy");
    expect(label).toContain("dd.MM.yyyy");
    expect(label).toContain("22.01.2026");
  });

  it("formatOptionToString should return just the format string when format is invalid", () => {
    const label = component.formatOptionToString("not-a-valid-format");
    expect(label).toBe("not-a-valid-format");
  });
});

describe("setGlobalDateFormat", () => {
  // Save original state and restore after each test
  let originalFormat: string;

  beforeEach(() => {
    originalFormat = defaultDateFormat();
  });

  afterEach(() => {
    setGlobalDateFormat(originalFormat);
  });

  it("should update defaultDateFormat signal", () => {
    setGlobalDateFormat("MM/dd/yyyy");
    expect(defaultDateFormat()).toBe("MM/dd/yyyy");
  });

  it("should update defaultDateTimeFormat signal to include time", () => {
    setGlobalDateFormat("MM/dd/yyyy");
    expect(defaultDateTimeFormat()).toBe("MM/dd/yyyy HH:mm");
  });

  it("should update datepickerFormat signal to Moment.js equivalent", () => {
    setGlobalDateFormat("MM/dd/yyyy");
    expect(datepickerFormat()).toBe("MM/DD/YYYY");
  });

  it("should not update signals when called with empty string", () => {
    setGlobalDateFormat("MM/dd/yyyy");
    setGlobalDateFormat("");
    expect(defaultDateFormat()).toBe("MM/dd/yyyy");
  });
});

describe("convertToMomentFormat", () => {
  it("should convert dd.MM.yyyy to DD.MM.YYYY", () => {
    expect(convertToMomentFormat("dd.MM.yyyy")).toBe("DD.MM.YYYY");
  });

  it("should convert MM/dd/yyyy to MM/DD/YYYY", () => {
    expect(convertToMomentFormat("MM/dd/yyyy")).toBe("MM/DD/YYYY");
  });

  it("should convert yyyy-MM-dd to YYYY-MM-DD", () => {
    expect(convertToMomentFormat("yyyy-MM-dd")).toBe("YYYY-MM-DD");
  });

  it("should convert dd/MM/yyyy to DD/MM/YYYY", () => {
    expect(convertToMomentFormat("dd/MM/yyyy")).toBe("DD/MM/YYYY");
  });

  it("should convert MMM d, yyyy to MMM D, YYYY", () => {
    expect(convertToMomentFormat("MMM d, yyyy")).toBe("MMM D, YYYY");
  });
});
