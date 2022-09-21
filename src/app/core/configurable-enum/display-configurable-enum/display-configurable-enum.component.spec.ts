import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DisplayConfigurableEnumComponent } from "./display-configurable-enum.component";
import { Note } from "../../../child-dev-project/notes/model/note";
import { Ordering } from "../configurable-enum-ordering";

describe("DisplayConfigurableEnumComponent", () => {
  let component: DisplayConfigurableEnumComponent;
  let fixture: ComponentFixture<DisplayConfigurableEnumComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayConfigurableEnumComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayConfigurableEnumComponent);
    component = fixture.componentInstance;
    component.value = { id: "testCategory", label: "Test Category" };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("displays value's label", () => {
    expect(fixture.debugElement.nativeElement.innerHTML).toBe("Test Category");
  });

  it("should use the background color is available", () => {
    const elem = fixture.debugElement.nativeElement;
    expect(elem.style["background-color"]).toBe("");

    const value: Ordering.EnumValue = {
      label: "withColor",
      id: "WITH_COLOR",
      color: "black",
      _ordinal: 1,
    };
    const entity = new Note();
    entity.warningLevel = value;
    component.onInitFromDynamicConfig({ id: "warningLevel", entity, value });
    fixture.detectChanges();

    expect(elem.style["background-color"]).toBe("black");
    expect(elem.style.padding).toBe("5px");
    expect(elem.style["border-radius"]).toBe("4px");
  });
});
