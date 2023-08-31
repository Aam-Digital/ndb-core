import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityPropertyViewComponent } from "./entity-property-view.component";
import { ConfigService } from "../../config/config.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { createTestingConfigService } from "../../config/testing-config-service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EntityPropertyViewComponent", () => {
  let component: EntityPropertyViewComponent;
  let fixture: ComponentFixture<EntityPropertyViewComponent>;

  let testEntity: Child;
  const testProperty: string = "dateOfBirth";

  beforeEach(async () => {
    testEntity = Child.create("tester");

    await TestBed.configureTestingModule({
      imports: [EntityPropertyViewComponent, MockedTestingModule],
      providers: [
        { provide: ConfigService, useValue: createTestingConfigService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityPropertyViewComponent);
    component = fixture.componentInstance;

    component.entity = testEntity;
    component.property = testProperty;

    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should get component from schema if not given", () => {
    component.ngOnInit();

    expect(component.component).toBe("DisplayDate");
  });

  it("should use component from input if given", () => {
    component.component = "DisplayText";
    component.ngOnInit();

    expect(component.component).toBe("DisplayText");
  });

  it("should get label from schema", () => {
    component.ngOnInit();

    expect(component.label).toBe(Child.schema.get(testProperty).label);
  });

  it("should support object as property config", () => {
    component.property = {
      id: "testId",
      label: "Test Label",
      view: "DisplayText",
      additional: "Some additional information",
    };
    component.ngOnInit();

    expect(component.label).toBe(component.property.label);
    expect(component.propertyName).toBe(component.property.id);
    expect(component.component).toBe(component.property.view);
    expect(component.additional).toBe(component.property.additional);
  });
});
