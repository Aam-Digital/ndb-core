import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DisplayConfigurableEnumComponent } from "./display-configurable-enum.component";
import { Ordering } from "../configurable-enum-ordering";

describe("DisplayConfigurableEnumComponent", () => {
  let component: DisplayConfigurableEnumComponent;
  let fixture: ComponentFixture<DisplayConfigurableEnumComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DisplayConfigurableEnumComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayConfigurableEnumComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({
      value: { id: "testCategory", label: "Test Category" },
    } as any);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display label of value", () => {
    expect(fixture.debugElement.nativeElement.innerHTML).toBe("Test Category");
  });

  it("should use the background color if available", () => {
    const elem = fixture.debugElement.nativeElement;
    expect(elem.style["background-color"]).toBe("");

    const value: Ordering.EnumValue = {
      label: "withColor",
      id: "WITH_COLOR",
      color: "black",
      _ordinal: 1,
    };
    component.onInitFromDynamicConfig({ value } as any);
    fixture.detectChanges();

    expect(elem.style["background-color"]).toBe("black");
    expect(elem.style.padding).toBe("5px");
    expect(elem.style["border-radius"]).toBe("4px");
  });

  it("should concatenate multiple values", () => {
    const first = { id: "1", label: "First" };

    const second = { id: "2", label: "Second" };
    component.onInitFromDynamicConfig({ value: [first, second] } as any);
    fixture.detectChanges();

    expect(fixture.debugElement.nativeElement.innerHTML).toBe("First, Second");
  });
});
