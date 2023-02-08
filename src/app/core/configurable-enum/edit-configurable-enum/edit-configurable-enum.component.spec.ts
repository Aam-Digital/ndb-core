import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";
import { FormControl, FormGroup } from "@angular/forms";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { ConfigurableEnum } from "../configurable-enum";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditConfigurableEnumComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ConfigurableEnumService,
          useValue: { getEnum: () => new ConfigurableEnum() },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditConfigurableEnumComponent);
    component = fixture.componentInstance;
    initWithSchema({ innerDataType: "some-id" });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should extract the enum ID", () => {
    initWithSchema({ innerDataType: "some-id" });
    expect(component.enumId).toBe("some-id");

    initWithSchema({ dataType: "array", additional: "other-id" });
    expect(component.enumId).toBe("other-id");
  });

  it("should detect multi selection mode", () => {
    initWithSchema({ innerDataType: "some-id" });
    expect(component.multi).toBeFalse();

    initWithSchema({ dataType: "array", additional: "some-id" });
    expect(component.multi).toBeTrue();
  });

  function initWithSchema(schema: EntitySchemaField) {
    const fromGroup = new FormGroup({ test: new FormControl() });
    component.onInitFromDynamicConfig({
      formControl: fromGroup.get("test"),
      formFieldConfig: { id: "test" },
      propertySchema: schema,
      entity: new Entity(),
    });
  }
});
