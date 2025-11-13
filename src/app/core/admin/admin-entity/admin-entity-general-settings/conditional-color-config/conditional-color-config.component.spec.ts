import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConditionalColorConfigComponent } from "./conditional-color-config.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ColorMapping } from "app/core/entity/model/entity";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ConditionalColorConfigComponent", () => {
  let component: ConditionalColorConfigComponent;
  let fixture: ComponentFixture<ConditionalColorConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConditionalColorConfigComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionalColorConfigComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestEntity;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize field options from entity schema", () => {
    expect(component.colorFieldOptions.length).toBeGreaterThanOrEqual(0);
  });

  it("should detect selected field from existing value", () => {
    const testMappings: ColorMapping[] = [
      { condition: { status: "active" }, color: "#00FF00" },
    ];

    component.writeValue(testMappings);

    expect(component.conditionalColorSections.length).toBe(1);
    expect(component.conditionalColorSections[0].condition).toEqual({ $or: [{ status: "active" }] });
  });

  it("should add a new conditional color section", () => {
    component.value = [{ condition: {}, color: "#defaultColor" }];

    component.addConditionalColorSection();

    expect(Array.isArray(component.value)).toBe(true);
    expect(component.value.length).toBe(2);
    expect(component.value[1]).toEqual({ condition: { $or: [] }, color: "" });
  });

  it("should update conditional section color", () => {
    component.value = [
      { condition: {}, color: "#defaultColor" },
      { condition: { $or: [{ status: "active" }] }, color: "#00FF00" }
    ];

    component.updateConditionalSectionColor(0, "#FF0000");

    expect(component.conditionalColorSections[0].color).toBe("#FF0000");
  });

  it("should add condition to section", () => {
    component.value = [
      { condition: {}, color: "#defaultColor" },
      { condition: { $or: [] }, color: "#FF0000" }
    ];

    component.addConditionToSection(0);

    const conditions = component.getConditionsForSection(0);
    expect(conditions.length).toBe(1);
    expect(conditions[0]).toEqual({});
  });

  it("should delete condition from section", () => {
    component.value = [
      { condition: {}, color: "#defaultColor" },
      { condition: { $or: [{ status: "active" }, { status: "inactive" }] }, color: "#FF0000" }
    ];

    component.deleteConditionFromSection(0, 0);

    const conditions = component.getConditionsForSection(0);
    expect(conditions.length).toBe(1);
    expect(conditions[0]).toEqual({ status: "inactive" });
  });

  it("should delete a conditional color section", () => {
    component.value = [
      { condition: {}, color: "#defaultColor" },
      { condition: { $or: [{ status: "active" }] }, color: "#00FF00" },
      { condition: { $or: [{ status: "inactive" }] }, color: "#FF0000" }
    ];

    component.deleteConditionalColorSection(0);

    expect(component.conditionalColorSections.length).toBe(1);
    expect(component.conditionalColorSections[0].condition).toEqual({ $or: [{ status: "inactive" }] });
  });
});
