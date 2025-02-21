import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditUrlComponent } from "./edit-url.component";
import { setupEditComponent } from "app/core/entity/default-datatype/edit-component.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";

fdescribe("EditUrlComponent", () => {
  let component: EditUrlComponent;
  let fixture: ComponentFixture<EditUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditUrlComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditUrlComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be invalid for value that is not a complete URL", () => {
    component.formControl.setValue("example");
    fixture.detectChanges();
    expect(component.formControl.hasError("invalid")).toBeTrue();
  });

  it("should be valid for empty value", () => {
    component.formControl.setValue("");
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();

    component.formControl.setValue(null);
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();
  });

  it("should be valid for url-like value", () => {
    component.formControl.setValue("https://test.com");
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();
  });

  it("should open link in a new tab when field is disabled and clicked", () => {
    const testUrl = "https://test.com";
    component.formControl.setValue(testUrl);
    component.formControl.disable();
    fixture.detectChanges();

    spyOn(window, "open");

    fixture.debugElement.query(By.css("mat-form-field")).nativeElement.click();

    expect(window.open).toHaveBeenCalledWith(testUrl, "_blank");
  });

  // Test cases for URL normalization
  function testPrefixNormalization(
    input: string,
    expected: string,
    originalValue?: string,
  ) {
    if (originalValue) {
      component.formControl.setValue(originalValue);
      fixture.detectChanges();
    }
    component.formControl.setValue(input);
    fixture.detectChanges();
    expect(component.formControl.value).toBe(expected);
  }

  it("should add 'https://' prefix if missing", () => {
    testPrefixNormalization("example.com", "https://example.com");
  });

  it("should show 'https://x' if first letter is 'x'", () => {
    testPrefixNormalization("x", "https://x");
  });

  it("should trim whitespace and show 'https://'", () => {
    testPrefixNormalization(" ", "https://");
  });

  it("should keep 'http://' prefix if present pasting a full url", () => {
    testPrefixNormalization("http://example.com", "http://example.com");
  });

  it("should keep 'https://' prefix if present pasting a full url", () => {
    testPrefixNormalization("https://example.com", "https://example.com");
  });

  it("should revert to 'https://' if prefix is broken", () => {
    testPrefixNormalization(
      "htps://example.com",
      "https://example.com",
      "https://example.com",
    );
  });

  it("should accept change from 'https://' to 'http://'", () => {
    testPrefixNormalization(
      "http://example.com",
      "http://example.com",
      "https://example.com",
    );
  });

  it("should correct 'httpx://' to 'https://'", () => {
    testPrefixNormalization(
      "httpx://example.com",
      "https://example.com",
      "https://example.com",
    );
  });

  it("should allow to change any part after the prefix", () => {
    testPrefixNormalization(
      "https://example2.com ",
      "https://example2.com",
      "https://example.com",
    );
  });

  // what if a full but broken URL is pasted? (e.g. from empty value to "htps://example.com")
});
