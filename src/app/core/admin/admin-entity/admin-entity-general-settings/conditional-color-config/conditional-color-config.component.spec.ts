import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConditionalColorConfigComponent } from "./conditional-color-config.component";
import { ColorMapping } from "app/core/entity/model/entity";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ConditionalColorConfigComponent", () => {
  let component: ConditionalColorConfigComponent;
  let fixture: ComponentFixture<ConditionalColorConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionalColorConfigComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionalColorConfigComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestEntity;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should detect selected field from existing value", () => {
    const testMappings: ColorMapping[] = [
      { condition: { $or: [{ status: "active" }] }, color: "#00FF00" },
    ];

    component.writeValue(testMappings);

    expect(component.conditionalColorSections.length).toBe(1);
    expect(component.conditionalColorSections[0].condition).toEqual({
      $or: [{ status: "active" }],
    });
  });

  it("should add a new conditional color section", () => {
    component.value = [{ condition: {}, color: "#defaultColor" }];

    component.addConditionalColorSection();

    expect(Array.isArray(component.value)).toBe(true);
    expect(component.value.length).toBe(2);
    expect(component.value[1]).toEqual({ condition: { $or: [{}] }, color: "" });
  });

  it("should update conditional section color", () => {
    component.value = [
      { condition: {}, color: "#defaultColor" },
      { condition: { $or: [{ status: "active" }] }, color: "#00FF00" },
    ];

    component.updateConditionalSectionColor(0, "#FF0000");

    expect(component.conditionalColorSections[0].color).toBe("#FF0000");
  });

  it("should have conditional color sections", () => {
    component.value = [
      { condition: {}, color: "#defaultColor" },
      { condition: { $or: [{ status: "active" }] }, color: "#00FF00" },
      { condition: { $or: [{ status: "inactive" }] }, color: "#FF0000" },
    ];

    expect(component.conditionalColorSections.length).toBe(2);
  });

  it("should delete a conditional color section", () => {
    component.value = [
      { condition: {}, color: "#defaultColor" },
      { condition: { $or: [{ status: "active" }] }, color: "#00FF00" },
      { condition: { $or: [{ status: "inactive" }] }, color: "#FF0000" },
    ];

    component.deleteConditionalColorSection(0);

    expect(component.conditionalColorSections.length).toBe(1);
    expect(component.conditionalColorSections[0].condition).toEqual({
      $or: [{ status: "inactive" }],
    });
  });
});
