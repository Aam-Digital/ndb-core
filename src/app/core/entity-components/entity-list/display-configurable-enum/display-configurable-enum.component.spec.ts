import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DisplayConfigurableEnumComponent } from "./display-configurable-enum.component";
import { ConfigurableEnumValue } from "../../../configurable-enum/configurable-enum.interface";
import { Entity } from "../../../entity/entity";

describe("DisplayConfigurableEnumComponent", () => {
  let component: DisplayConfigurableEnumComponent;
  let fixture: ComponentFixture<DisplayConfigurableEnumComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DisplayConfigurableEnumComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayConfigurableEnumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("displays value's label", () => {
    const testEntity = ({
      enumField: { id: "T1", label: "Test 1" } as ConfigurableEnumValue,
    } as unknown) as Entity;
    component.onInitFromDynamicConfig({ entity: testEntity, id: "enumField" });
    fixture.detectChanges();

    expect(fixture.debugElement.nativeElement.innerHTML).toBe("Test 1");
  });
});
