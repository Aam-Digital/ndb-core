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
    component["detectSelectedField"]();

    expect(component.selectedColorField).toBe("status");
  });

  it("should add a new rule", () => {
    component.selectedColorField = "status";
    component.value = [];

    component.addNewRule();

    expect(component.value).toEqual([{ condition: { status: "" }, color: "" }]);
  });

  it("should update rule condition", () => {
    component.value = [{ condition: { status: "active" }, color: "#00FF00" }];
    const newCondition = { status: "inactive" };

    component.updateRuleCondition(0, newCondition);

    expect(component.value[0].condition).toEqual(newCondition);
  });

  it("should not update rule condition if new condition is null", () => {
    const initialValue = [
      { condition: { status: "active" }, color: "#00FF00" },
    ];
    component.value = [...initialValue];

    component.updateRuleCondition(0, null);

    expect(component.value).toEqual(initialValue);
  });

  it("should update rule color", () => {
    component.value = [{ condition: { status: "active" }, color: "#00FF00" }];

    component.updateRuleColor(0, "#FF0000");

    expect(component.value[0].color).toBe("#FF0000");
  });

  it("should delete a rule", () => {
    component.value = [
      { condition: { status: "active" }, color: "#00FF00" },
      { condition: { status: "inactive" }, color: "#FF0000" },
    ];

    component.deleteRule(0);

    expect(component.value.length).toBe(1);
    expect(component.value[0].condition).toEqual({ status: "inactive" });
  });
});
