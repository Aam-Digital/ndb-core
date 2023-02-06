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
});
