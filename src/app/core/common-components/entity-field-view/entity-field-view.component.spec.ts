import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityFieldViewComponent } from "./entity-field-view.component";
import { ConfigService } from "../../config/config.service";
import { createTestingConfigService } from "../../config/testing-config-service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("EntityFieldViewComponent", () => {
  let component: EntityFieldViewComponent;
  let fixture: ComponentFixture<EntityFieldViewComponent>;

  let testEntity: TestEntity;
  const testProperty: string = "dateOfBirth";

  beforeEach(async () => {
    testEntity = TestEntity.create("tester");

    await TestBed.configureTestingModule({
      imports: [EntityFieldViewComponent, MockedTestingModule],
      providers: [
        { provide: ConfigService, useValue: createTestingConfigService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFieldViewComponent);
    component = fixture.componentInstance;

    component.entity = testEntity;
    component.field = { id: testProperty };

    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should get component from schema if not given", () => {
    component.ngOnChanges({ field: true as any });

    expect(component._field.viewComponent).toBe("DisplayDate");
  });

  it("should get label from schema", () => {
    component.ngOnChanges({ field: true as any });

    expect(component._field.label).toBe(
      TestEntity.schema.get(testProperty).label,
    );
  });

  it("should support object as property config", () => {
    const testField = {
      id: "testId",
      label: "Test Label",
      viewComponent: "DisplayText",
      additional: "Some additional information",
    };
    component.field = testField;
    component.ngOnChanges({ field: true as any });

    expect(component._field.label).toBe(testField.label);
    expect(component._field.viewComponent).toBe(testField.viewComponent);
    expect(component._field.additional).toBe(testField.additional);
  });
});
