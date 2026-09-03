import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayTextComponent } from "./display-text.component";

describe("DisplayTextComponent", () => {
  let component: DisplayTextComponent;
  let fixture: ComponentFixture<DisplayTextComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DisplayTextComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTextComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("value", "text");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not render '[object Object]' for an object value", () => {
    fixture.componentRef.setInput("value", { foo: "bar" });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.trim();
    expect(text).not.toContain("[object Object]");
    expect(text).toBe(JSON.stringify({ foo: "bar" }));
  });

  it("should not render '[object Object]' for an array of objects", () => {
    fixture.componentRef.setInput("value", [{ foo: "bar" }, { baz: "qux" }]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.trim();
    expect(text).not.toContain("[object Object]");
    expect(text).toBe(JSON.stringify([{ foo: "bar" }, { baz: "qux" }]));
  });
});
