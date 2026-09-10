import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayTextComponent } from "./display-text.component";

describe("DisplayTextComponent", () => {
  let fixture: ComponentFixture<DisplayTextComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DisplayTextComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTextComponent);
  });

  // as the fallback for fields without a dataType, this receives non-strings;
  // objects would otherwise interpolate as "[object Object]"
  it.each([
    ["plain text", "plain text"],
    [["startup", "referral"], "startup,referral"],
    [{ foo: "bar" }, `{"foo":"bar"}`],
    [[{ foo: "bar" }, { baz: "qux" }], `{"foo":"bar"},{"baz":"qux"}`],
  ])("renders %j as %s", (value, expected) => {
    fixture.componentRef.setInput("value", value);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe(expected);
  });
});
